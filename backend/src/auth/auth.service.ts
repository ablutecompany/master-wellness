import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  /**
   * Obter perfil do utilizador diretamente da tabela "profiles" via UUID do Supabase.
   */
  async getProfileByUid(uid: string) {
    try {
      // 1. Obter Household Data separadamente, pois foi adicionado por script manual à tabela profiles
      let householdData = null;
      try {
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_data JSONB`);
        const hhRes = await this.prisma.$queryRaw<any[]>`SELECT household_data as "householdData" FROM public.profiles WHERE id = ${uid}::uuid`;
        if (hhRes && hhRes.length > 0) {
          householdData = hhRes[0].householdData;
        }
      } catch (e) {
        // Ignorar falha estrutural do household
      }

      // 2. Obter Perfil Base usando Prisma de forma segura
      let profileBase = await this.prisma.userProfile.findUnique({
        where: { id: uid }
      });

      if (!profileBase) {
        profileBase = await this.prisma.userProfile.create({
          data: {
            id: uid,
            height: 170,
            baseWeight: 70,
            mainGoal: 'general_wellness',
            secondaryGoals: [],
            activityLevel: 'moderate',
            dietaryRestrictions: [],
            allergies: [],
            currentSupplementation: [],
            reportedMedication: [],
            reportedSymptoms: [],
          }
        });
      }

      // 3. Obter dados estendidos guardados na tabela 'profiles' via raw SQL (name, date_of_birth, sex, timezone, country, avatar_url)
      let extendedData: any = {};
      try {
        const extRes = await this.prisma.$queryRaw<any[]>`SELECT name, date_of_birth as "dateOfBirth", sex, timezone, country, avatar_url as "avatarUrl" FROM public.profiles WHERE id = ${uid}::uuid`;
        if (extRes && extRes.length > 0) {
          extendedData = extRes[0];
        }
      } catch (e) {}

      const user = {
        id: uid,
        email: profileBase.id, // Em M5 vamos usar o email do token auth, por agora stub
        name: extendedData.name || 'Utilizador',
        dateOfBirth: extendedData.dateOfBirth || null,
        sex: extendedData.sex || null,
        timezone: extendedData.timezone || null,
        country: extendedData.country || null,
        profile: {
          ...profileBase,
          avatarUrl: extendedData.avatarUrl || null
        }
      };

      // 3. Obter o último peso medido nas análises, se existir
      let latestMeasuredWeight: number | null = null;
      try {
        const measurements = await this.prisma.$queryRaw<any[]>`
          SELECT m.value
          FROM public.analysis_measurements m
          JOIN public.analyses a ON m.analysis_id = a.id
          WHERE a.owner_id = ${uid}::uuid AND m.type = 'weight'
          ORDER BY m.measured_at DESC, m.created_at DESC
          LIMIT 1
        `;
        if (measurements && measurements.length > 0 && measurements[0].value) {
          latestMeasuredWeight = Number(measurements[0].value);
        }
      } catch (e) {}

      // 4. Lidar com o campo 'manualWeight' (antigamente na profiles, podemos verificar se ainda existe ou se era falso)
      let parsedManualWeight: number | null = null;
      try {
        const wtRes = await this.prisma.$queryRaw<any[]>`SELECT weight as "manualWeight" FROM public.profiles WHERE id = ${uid}::uuid`;
        if (wtRes && wtRes.length > 0 && wtRes[0].manualWeight !== null) {
          parsedManualWeight = Number(wtRes[0].manualWeight);
        }
      } catch(e) {}

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

      // 5. Retornar contrato canónico esperado pelo frontend
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        // Canonical shape mapping
        height: user.profile?.height || null,
        dateOfBirth: user.dateOfBirth ? (typeof user.dateOfBirth === 'string' ? user.dateOfBirth.split('T')[0] : user.dateOfBirth.toISOString().split('T')[0]) : null,
        sex: user.sex || null,
        timezone: user.timezone || null,
        country: user.country || null,
        weight: weightObj,
        baseWeight: user.profile?.baseWeight || null,
        mainGoal: user.profile?.mainGoal || null,
        goals: user.profile?.mainGoal ? [user.profile.mainGoal, ...(user.profile.secondaryGoals || [])] : [],
        activityLevel: user.profile?.activityLevel || null,
        dietaryRestrictions: user.profile?.dietaryRestrictions || [],
        activeAnalysisId: user.profile?.activeAnalysisId || null,
        household: householdData || null,
        // Outros metadados disponíveis na tabela profile
      };
    } catch (err: any) {
      console.warn(`[getProfileByUid] Erro grave:`, err.message);
      // Aqui NÃO podemos retornar null silenciosamente se falhar, caso contrário cai no fallback.
      // Se estoirou a este ponto (ex: prisma off), lança o erro para o controlador
      throw err;
    }
  }

  /**
   * Inicializar perfil para utilizador autenticado via Supabase sem perfil no backend.
   * Cria o User e o UserProfile com valores base seguros.
   */
  async initializeProfile(uid: string, email: string, displayName?: string) {
    // Upsert the UserProfile directly. We skip User since it doesn't exist in the DB.
    const targetUserId = uid;

    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT`);
    } catch (e) {}

    const profile = await this.prisma.userProfile.upsert({
      where: { id: targetUserId },
      update: {},
      create: {
        id: targetUserId,
        height: 170,
        baseWeight: 70,
        mainGoal: 'general_wellness',
        secondaryGoals: [],
        activityLevel: 'moderate',
        dietaryRestrictions: [],
        allergies: [],
        currentSupplementation: [],
        reportedMedication: [],
        reportedSymptoms: [],
      },
    });

    const displayNameValue = displayName || email.split('@')[0];
    try {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET name = COALESCE(name, ${displayNameValue}), 
            date_of_birth = COALESCE(date_of_birth, '1990-01-01'::timestamp), 
            sex = COALESCE(sex, 'other'), 
            country = COALESCE(country, 'PT'), 
            timezone = COALESCE(timezone, 'Europe/Lisbon'),
            updated_at = now()
        WHERE id = ${targetUserId}::uuid
      `;
    } catch (e) {}

    return profile;
  }

  /**
   * Verificar se uma sessão é válida e devolver o Perfil (M5 Fatia 1).
   * Identidade baseada no UUID do Supabase.
   */
  async validateSession(token: string) {
    // Nota: Em M5 real, a validação é feita via JwtStrategy/JWKS.
    // Este método serve para suporte a fluxos legados ou internos que precisem do perfil.
    const session = await this.prisma.session.findUnique({
      where: { token },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }

    return this.prisma.userProfile.findUnique({
      where: { id: session.userId }
    });
  }
}
