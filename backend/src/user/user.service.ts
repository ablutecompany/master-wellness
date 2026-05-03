import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const { password, ...userData } = data as any;
    const passwordHash = await bcrypt.hash(password, 10);
    
    return this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, preferences: true },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { id: userId },
    });
  }

  async updateProfile(userId: string, data: Prisma.UserProfileUpdateInput) {
    return this.prisma.userProfile.update({
      where: { id: userId },
      data,
    });
  }

  async getHousehold(userId: string) {
    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_data JSONB`);
    } catch (e) {}

    // 1. Sou eu o dono?
    const res = await this.prisma.$queryRaw<any[]>`SELECT household_data as "householdData", id as "ownerId" FROM public.profiles WHERE id = ${userId}::uuid`;
    if (res && res.length > 0 && res[0].householdData) {
      return { ...res[0].householdData, ownerId: res[0].ownerId };
    }

    // 2. Sou eu um membro convidado/ligado?
    const searchJson = JSON.stringify([{ userId: userId }]);
    const memberRes = await this.prisma.$queryRaw<any[]>`
      SELECT household_data as "householdData", id as "ownerId" 
      FROM public.profiles 
      WHERE household_data->'members' @> ${searchJson}::jsonb
      LIMIT 1
    `;
    if (memberRes && memberRes.length > 0 && memberRes[0].householdData) {
       return { ...memberRes[0].householdData, ownerId: memberRes[0].ownerId };
    }

    return null;
  }

  async patchHousehold(userId: string, data: any) {
    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_data JSONB`);
    } catch (e) {}

    const currentHh = await this.getHousehold(userId);
    const targetUserId = currentHh?.ownerId || userId;

    const payloadToSave = { ...data };
    delete payloadToSave.ownerId; // Cleanup safety

    await this.prisma.$executeRaw`
      UPDATE public.profiles 
      SET household_data = ${payloadToSave}::jsonb, updated_at = now()
      WHERE id = ${targetUserId}::uuid
    `;
    return payloadToSave;
  }

  async createInvite(ownerUserId: string, memberId: string, email: string) {
    const hh = await this.getHousehold(ownerUserId);
    if (!hh || hh.ownerId !== ownerUserId) throw new ConflictException('Apenas o dono do agregado pode convidar');
    
    if (!hh.invitations) hh.invitations = [];
    const inviteId = 'inv_' + Math.random().toString(36).substring(2, 9);
    hh.invitations.push({
      id: inviteId,
      memberId,
      email: email.toLowerCase(),
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    await this.patchHousehold(ownerUserId, hh);
    return hh;
  }

  async acceptInvite(inviteeUserId: string, inviteId: string) {
    // Procura o dono do agregado que emitiu este convite (via pesquisa postgres JSON)
    const searchJson = JSON.stringify([{ id: inviteId, status: 'pending' }]);
    const res = await this.prisma.$queryRaw<any[]>`
      SELECT household_data as "householdData", id as "ownerId" 
      FROM public.profiles 
      WHERE household_data->'invitations' @> ${searchJson}::jsonb
      LIMIT 1
    `;
    
    if (!res || res.length === 0) throw new ConflictException('Convite inválido ou expirado');
    const hh = res[0].householdData;
    const ownerId = res[0].ownerId;

    // Marca o convite como aceite e emparelha a conta real
    hh.invitations = hh.invitations.map(inv => inv.id === inviteId ? { ...inv, status: 'accepted', activatedByUserId: inviteeUserId, activatedAt: new Date().toISOString() } : inv);
    const targetInvite = hh.invitations.find(i => i.id === inviteId);
    if (targetInvite) {
      hh.members = hh.members.map(m => m.id === targetInvite.memberId ? { ...m, userId: inviteeUserId } : m);
    }
    
    // Apaga/limpa o household temporário do invitee se existir vazio, para não entrar em conflito
    await this.prisma.$executeRaw`UPDATE public.profiles SET household_data = NULL WHERE id = ${inviteeUserId}::uuid`;

    await this.patchHousehold(ownerId, hh);
    return { ...hh, ownerId };
  }

  async updateCombinedProfile(
    userId: string, 
    updates: { 
      name?: string, 
      avatarUrl?: string, 
      dateOfBirth?: string, 
      dateOfBirthPrecision?: string, 
      height?: number, 
      sex?: string, 
      timezone?: string, 
      country?: string, 
      weight?: { manualValue?: number | null },
      goals?: string[],
      activityLevel?: string,
      dietaryRestrictions?: string[]
    }
  ) {
    const { 
      name, avatarUrl, dateOfBirth, dateOfBirthPrecision, 
      height, sex, timezone, country, weight,
      goals, activityLevel, dietaryRestrictions
    } = updates;
    
    console.log('[P0_PROFILE_PATCH] FieldsReceived:', JSON.stringify(updates));
    console.log(`[P0_PROFILE_PATCH] dateOfBirthReceived: ${dateOfBirth}, sexReceived: ${sex}, avatarUrlReceived: ${avatarUrl}`);

    // 1. Preparar dados para o User
    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (dateOfBirth !== undefined) {
      const parsedDate = new Date(dateOfBirth);
      if (!isNaN(parsedDate.getTime())) {
        userData.dateOfBirth = parsedDate;
      } else {
        console.warn(`[P0_PROFILE_PATCH] Invalid dateOfBirth received: ${dateOfBirth}`);
      }
    }
    if (sex !== undefined) userData.sex = sex;
    if (timezone !== undefined) userData.timezone = timezone;
    if (country !== undefined) userData.country = country;

    // Garantir que a linha existe na tabela profiles antes de fazer o raw SQL UPDATE
    await this.prisma.userProfile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        height: height !== undefined ? height : 170,
        baseWeight: 0,
        mainGoal: goals && goals.length > 0 ? goals[0] : 'general_wellness',
        secondaryGoals: goals && goals.length > 1 ? goals.slice(1) : [],
        activityLevel: activityLevel || 'sedentary',
        dietaryRestrictions: dietaryRestrictions || []
      },
    });

    // Como a tabela public.User não existe no atual estado da BD, temos de gravar estas propriedades base diretamente na public.profiles usando raw SQL
    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT`);
    } catch (e) {}

    if (userData.name !== undefined) {
      await this.prisma.$executeRaw`UPDATE public.profiles SET name = ${userData.name}, updated_at = now() WHERE id = ${userId}::uuid`;
    }
    if (userData.dateOfBirth !== undefined) {
      await this.prisma.$executeRaw`UPDATE public.profiles SET date_of_birth = ${userData.dateOfBirth}, updated_at = now() WHERE id = ${userId}::uuid`;
    }
    if (userData.sex !== undefined) {
      await this.prisma.$executeRaw`UPDATE public.profiles SET sex = ${userData.sex}, updated_at = now() WHERE id = ${userId}::uuid`;
    }
    if (userData.timezone !== undefined) {
      await this.prisma.$executeRaw`UPDATE public.profiles SET timezone = ${userData.timezone}, updated_at = now() WHERE id = ${userId}::uuid`;
    }
    if (userData.country !== undefined) {
      await this.prisma.$executeRaw`UPDATE public.profiles SET country = ${userData.country}, updated_at = now() WHERE id = ${userId}::uuid`;
    }
    
    console.log(`[P0_PROFILE_PATCH] userUpdated via raw SQL: true, fields: ${Object.keys(userData).join(', ')}`);

    // Como avatarUrl, date_of_birth_precision e weight não estão no schema de User nem de UserProfile originais, e eram adicionados à tabela profiles (UserProfile), precisamos de usar raw sql apenas para estes campos, OU ignorar se os tipos falharem.
    if (avatarUrl !== undefined) {
      try { await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`); } catch (e) {}
      await this.prisma.$executeRaw`UPDATE public.profiles SET avatar_url = ${avatarUrl}, updated_at = now() WHERE id = ${userId}::uuid`;
      console.log(`[P0_PROFILE_PATCH] avatarUrlSaved: ${avatarUrl}`);
    }

    if (dateOfBirthPrecision !== undefined) {
      try { await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth_precision TEXT`); } catch (e) {}
      await this.prisma.$executeRaw`UPDATE public.profiles SET date_of_birth_precision = ${dateOfBirthPrecision}, updated_at = now() WHERE id = ${userId}::uuid`;
    }

    if (weight && weight.manualValue !== undefined) {
      if (weight.manualValue === null) {
        await this.prisma.$executeRaw`UPDATE public.profiles SET weight = NULL, updated_at = now() WHERE id = ${userId}::uuid`;
      } else {
        await this.prisma.$executeRaw`UPDATE public.profiles SET weight = ${weight.manualValue}::numeric, updated_at = now() WHERE id = ${userId}::uuid`;
      }
    }

    // 2. Preparar dados para o UserProfile
    const profileData: any = {};
    if (height !== undefined) profileData.height = height;
    if (goals !== undefined && goals.length > 0) {
      profileData.mainGoal = goals[0];
      profileData.secondaryGoals = goals.slice(1);
    } else if (goals !== undefined && goals.length === 0) {
      profileData.mainGoal = 'none';
      profileData.secondaryGoals = [];
    }
    if (activityLevel !== undefined) profileData.activityLevel = activityLevel;
    if (dietaryRestrictions !== undefined) profileData.dietaryRestrictions = dietaryRestrictions;

    if (Object.keys(profileData).length > 0 || height !== undefined) {
      await this.prisma.userProfile.update({
        where: { id: userId },
        data: profileData,
      });
    }

    // 3. Read back (usando a mesma lógica do getProfileByUid para coerência)
    let profileBase;
    try {
      profileBase = await this.prisma.userProfile.findUnique({
        where: { id: userId }
      });
    } catch (err: any) {
      console.warn(`[P0_PROFILE_PATCH] profile fetch fallback`);
      profileBase = null;
    }

    // Não lançamos erro se profileBase falhar, pois a tabela profiles pode não ter este ID explicitamente na Prisma mas o utilizador existe.
    // O resto do código já suporta profileBase?.height, etc.

    let householdData = null;
    let avatarRaw = null;
    let dobPrec = null;
    let manualWt: number | null = null;

    try {
      const extra = await this.prisma.$queryRaw<any[]>`SELECT avatar_url as "avatarUrl", date_of_birth_precision as "dobPrec", weight as "manualWeight", household_data as "householdData" FROM public.profiles WHERE id = ${userId}::uuid`;
      if (extra && extra.length > 0) {
        householdData = extra[0].householdData;
        avatarRaw = extra[0].avatarUrl;
        dobPrec = extra[0].dobPrec;
        manualWt = extra[0].manualWeight !== null ? Number(extra[0].manualWeight) : null;
      }
    } catch (e) {}

    let latestMeasuredWeight: number | null = null;
    try {
      const measurements = await this.prisma.$queryRaw<any[]>`
        SELECT m.value FROM public.analysis_measurements m
        JOIN public.analyses a ON m.analysis_id = a.id
        WHERE a.owner_id = ${userId}::uuid AND m.type = 'weight'
        ORDER BY m.measured_at DESC, m.created_at DESC LIMIT 1
      `;
      if (measurements && measurements.length > 0 && measurements[0].value) {
        latestMeasuredWeight = Number(measurements[0].value);
      }
    } catch (e) {}

    let weightSource: 'measured' | 'manual' | 'missing' = 'missing';
    let currentWeightValue: number | null = null;
    
    if (manualWt !== null) {
      weightSource = 'manual';
      currentWeightValue = manualWt;
    } else if (latestMeasuredWeight !== null) {
      weightSource = 'measured';
      currentWeightValue = latestMeasuredWeight;
    }

    const weightObj = {
      value: currentWeightValue,
      source: weightSource,
      manualValue: manualWt,
      measuredValue: latestMeasuredWeight,
      isDiscrepant: manualWt !== null && latestMeasuredWeight !== null && Math.abs(manualWt - latestMeasuredWeight) >= 2.5
    };

    let extName = null;
    let extDateOfBirth = null;
    let extSex = null;
    let extTimezone = null;
    let extCountry = null;

    try {
      const dbExt = await this.prisma.$queryRaw<any[]>`SELECT name, date_of_birth as "dateOfBirth", sex, timezone, country FROM public.profiles WHERE id = ${userId}::uuid`;
      if (dbExt && dbExt.length > 0) {
        extName = dbExt[0].name;
        extDateOfBirth = dbExt[0].dateOfBirth;
        extSex = dbExt[0].sex;
        extTimezone = dbExt[0].timezone;
        extCountry = dbExt[0].country;
      }
    } catch (e) {}

    const finalProfile = {
      id: userId,
      email: '', 
      name: extName || null,
      avatarUrl: avatarRaw || null,
      dateOfBirth: extDateOfBirth ? new Date(extDateOfBirth).toISOString().split('T')[0] : null,
      dateOfBirthPrecision: dobPrec || null,
      height: profileBase?.height || null,
      sex: extSex || null,
      timezone: extTimezone || null,
      country: extCountry || null,
      weight: weightObj,
      baseWeight: profileBase?.baseWeight || null,
      mainGoal: profileBase?.mainGoal || null,
      goals: profileBase?.mainGoal ? [profileBase.mainGoal, ...(profileBase.secondaryGoals || [])] : [],
      activityLevel: profileBase?.activityLevel || null,
      dietaryRestrictions: profileBase?.dietaryRestrictions || [],
      activeAnalysisId: profileBase?.activeAnalysisId || null,
      household: householdData || null,
    };
    
    console.log(`[P0_PROFILE_PATCH] readBackDateOfBirth: ${finalProfile.dateOfBirth}, readBackSex: ${finalProfile.sex}`);
    return finalProfile;
  }

  async updateActiveAnalysis(userId: string, analysisId: string | null) {
    return this.prisma.userProfile.update({
      where: { id: userId },
      data: {
        activeAnalysisId: analysisId,
      },
    });
  }
}
