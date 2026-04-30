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

  async updateCombinedProfile(userId: string, updates: { name?: string, avatarUrl?: string, dateOfBirth?: string, dateOfBirthPrecision?: string, height?: number, sex?: string, timezone?: string, country?: string, weight?: { manualValue?: number | null } }) {
    const { name, avatarUrl, dateOfBirth, dateOfBirthPrecision, height, sex, timezone, country, weight } = updates;
    
    // Update name directly in public.profiles since public.User doesn't exist
    if (name !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET name = ${name}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (avatarUrl !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET avatar_url = ${avatarUrl}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (dateOfBirth !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET date_of_birth = ${dateOfBirth}::date, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (dateOfBirthPrecision !== undefined) {
      try {
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth_precision TEXT`);
      } catch (e) {}
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET date_of_birth_precision = ${dateOfBirthPrecision}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (height !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET height = ${height}::numeric, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (sex !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET sex = ${sex}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (timezone !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET timezone = ${timezone}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (country !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET country = ${country}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    if (weight && weight.manualValue !== undefined) {
      if (weight.manualValue === null) {
        await this.prisma.$executeRaw`
          UPDATE public.profiles 
          SET weight = NULL, updated_at = now()
          WHERE id = ${userId}::uuid
        `;
      } else {
        await this.prisma.$executeRaw`
          UPDATE public.profiles 
          SET weight = ${weight.manualValue}::numeric, updated_at = now()
          WHERE id = ${userId}::uuid
        `;
      }
    }

    // Update height in UserProfile table
    if (height !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { id: userId },
        update: { height: height },
        create: {
          id: userId,
          height: height,
          baseWeight: 0,
          mainGoal: 'none',
          activityLevel: 'sedentary'
        },
      });
    }
    
    // Fetch the updated profile using raw query to avoid Prisma map crashes
    const profiles = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, name, avatar_url as "avatarUrl", TO_CHAR(date_of_birth, 'YYYY-MM-DD') as "dateOfBirth", date_of_birth_precision as "dateOfBirthPrecision", height as "heightCm", sex, timezone, country, weight as "manualWeight", active_analysis_id as "activeAnalysisId", household_data as "householdData"
      FROM public.profiles 
      WHERE id = ${userId}::uuid
    `;

    if (!profiles || profiles.length === 0) throw new Error('Profile not found after update in public.profiles');
    
    const p = profiles[0];

    let pPrisma: any = null;
    try {
       pPrisma = await this.prisma.userProfile.findUnique({ where: { id: userId } });
    } catch(e) {}

    let latestMeasuredWeight: number | null = null;
    try {
      const measurements = await this.prisma.$queryRaw<any[]>`
        SELECT m.value
        FROM public.analysis_measurements m
        JOIN public.analyses a ON m.analysis_id = a.id
        WHERE a.owner_id = ${userId}::uuid AND m.type = 'weight'
        ORDER BY m.measured_at DESC, m.created_at DESC
        LIMIT 1
      `;
      if (measurements && measurements.length > 0 && measurements[0].value) {
        latestMeasuredWeight = Number(measurements[0].value);
      }
    } catch (e) {}

    const parsedManualWeight = p.manualWeight !== null ? Number(p.manualWeight) : null;
    let weightSource: 'measured' | 'manual' | 'missing' = 'missing';
    let currentWeightValue: number | null = null;
    
    if (parsedManualWeight !== null) {
      weightSource = 'manual';
      currentWeightValue = parsedManualWeight;
    } else if (latestMeasuredWeight !== null) {
      weightSource = 'measured';
      currentWeightValue = latestMeasuredWeight;
    }

    const isDiscrepant = parsedManualWeight !== null && latestMeasuredWeight !== null && Math.abs(parsedManualWeight - latestMeasuredWeight) >= 2.5;

    const weightObj = {
      value: currentWeightValue,
      source: weightSource,
      manualValue: parsedManualWeight,
      measuredValue: latestMeasuredWeight,
      isDiscrepant
    };

    return {
      id: p.id,
      email: p.email,
      name: p.name,
      avatarUrl: p.avatarUrl || null,
      height: p.heightCm !== null ? Number(p.heightCm) : (pPrisma?.height || null),
      dateOfBirth: p.dateOfBirth || null,
      dateOfBirthPrecision: p.dateOfBirthPrecision || null,
      sex: p.sex || null,
      timezone: p.timezone || null,
      country: p.country || null,
      weight: weightObj,
      baseWeight: pPrisma?.baseWeight || null,
      mainGoal: pPrisma?.mainGoal || null,
      activeAnalysisId: p.activeAnalysisId,
      household: p.householdData || null
    };
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
