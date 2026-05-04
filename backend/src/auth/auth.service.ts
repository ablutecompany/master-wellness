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

      // 2. Garantir que o perfil base existe na tabela profiles
      try {
        await this.prisma.$executeRaw`
          INSERT INTO public.profiles (id, height, base_weight, main_goal, secondary_goals, activity_level, dietary_restrictions, allergies, current_supplementation, reported_medication, reported_symptoms, updated_at)
          VALUES (${uid}::uuid, 170, 70, 'general_wellness', '{}', 'moderate', '{}', '{}', '{}', '{}', '{}', now())
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (e) {
        // Ignorar se a tabela não suportar algumas destas colunas, fazemos um insert básico
        try {
          await this.prisma.$executeRaw`
            INSERT INTO public.profiles (id, updated_at)
            VALUES (${uid}::uuid, now())
            ON CONFLICT (id) DO NOTHING
          `;
        } catch (e2) {}
      }

      // 3. Obter dados guardados na tabela 'profiles' via raw SQL (bypassing Prisma strict schema)
      let extendedData: any = {};
      try {
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sex TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height NUMERIC`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS base_weight NUMERIC`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS main_goal TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_goals TEXT[]`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[]`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_analysis_id TEXT`);
        await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth_precision TEXT`);

        const extRes = await this.prisma.$queryRaw<any[]>`
          SELECT 
            name, to_char(date_of_birth, 'YYYY-MM-DD') as "dateOfBirth", date_of_birth_precision as "dateOfBirthPrecision", sex, timezone, country, avatar_url as "avatarUrl",
            height, base_weight as "baseWeight", main_goal as "mainGoal", 
            secondary_goals as "secondaryGoals", activity_level as "activityLevel",
            dietary_restrictions as "dietaryRestrictions", active_analysis_id as "activeAnalysisId"
          FROM public.profiles 
          WHERE id = ${uid}::uuid
        `;
        if (extRes && extRes.length > 0) {
          extendedData = extRes[0];
        }
      } catch (e) {
        console.warn('[getProfileByUid] raw query errored, falling back', e);
      }

      const user = {
        id: uid,
        email: uid, // Em M5 vamos usar o email do token auth, por agora stub
        name: extendedData.name || 'Utilizador',
        dateOfBirth: extendedData.dateOfBirth || null,
        dateOfBirthPrecision: extendedData.dateOfBirthPrecision || null,
        sex: extendedData.sex || null,
        timezone: extendedData.timezone || null,
        country: extendedData.country || null,
        profile: {
          height: extendedData.height || 170,
          baseWeight: extendedData.baseWeight || 70,
          mainGoal: extendedData.mainGoal || 'general_wellness',
          secondaryGoals: extendedData.secondaryGoals || [],
          activityLevel: extendedData.activityLevel || 'moderate',
          dietaryRestrictions: extendedData.dietaryRestrictions || [],
          activeAnalysisId: extendedData.activeAnalysisId || null,
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

      console.log('[P0_AVATAR_AUTH_ME]', {
        userId: user.id,
        hasAvatar: !!extendedData.avatarUrl,
        avatarLength: extendedData.avatarUrl ? extendedData.avatarUrl.length : 0
      });

      // 5. Retornar contrato canónico esperado pelo frontend
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.profile?.avatarUrl || null,
        dateOfBirth: user.dateOfBirth ? (typeof user.dateOfBirth === 'string' ? user.dateOfBirth.split('T')[0] : user.dateOfBirth.toISOString().split('T')[0]) : null,
        dateOfBirthPrecision: user.dateOfBirthPrecision || null,
        sex: user.sex || null,
        height: user.profile?.height || null,
        weight: weightObj,
        country: user.country || null,
        timezone: user.timezone || null,
        mainGoal: user.profile?.mainGoal || null,
        goals: user.profile?.mainGoal ? [user.profile.mainGoal, ...(user.profile.secondaryGoals || [])] : [],
        activityLevel: user.profile?.activityLevel || null,
        dietaryRestrictions: user.profile?.dietaryRestrictions || [],
        activeAnalysisId: user.profile?.activeAnalysisId || null,
        household: householdData || null,
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

    try {
      await this.prisma.$executeRaw`
        INSERT INTO public.profiles (id, height, base_weight, main_goal, secondary_goals, activity_level, dietary_restrictions, allergies, current_supplementation, reported_medication, reported_symptoms, updated_at)
        VALUES (${targetUserId}::uuid, 170, 70, 'general_wellness', '{}', 'moderate', '{}', '{}', '{}', '{}', '{}', now())
        ON CONFLICT (id) DO NOTHING
      `;
    } catch (e) {
      try {
        await this.prisma.$executeRaw`
          INSERT INTO public.profiles (id, updated_at)
          VALUES (${targetUserId}::uuid, now())
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (e2) {}
    }

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

    return { id: targetUserId };
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
