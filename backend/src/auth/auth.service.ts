import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  /**
   * Obter perfil do utilizador diretamente da tabela "profiles" via UUID do Supabase.
   */
  /**
   * Obter perfil do utilizador diretamente da tabela "profiles" via UUID do Supabase.
   * Transforma em contrato canónico para o frontend.
   */
  async getProfileByUid(uid: string) {
    try {
      try { await this.prisma.$executeRawUnsafe(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS household_data JSONB`); } catch (e) {}
      const profiles = await this.prisma.$queryRaw<any[]>`
        SELECT id, email, name, TO_CHAR(date_of_birth, 'YYYY-MM-DD') as "dateOfBirth", sex, timezone, country, height as "heightCm", weight as "manualWeight", active_analysis_id as "activeAnalysisId", household_data as "householdData"
        FROM public.profiles 
        WHERE id = ${uid}::uuid
      `;
      
      if (!profiles || profiles.length === 0) return null;
      
      const p = profiles[0];
      
      let pPrisma: any = null;
      try {
         // Silently safely attempt to read the rest from UserProfile
         pPrisma = await this.prisma.userProfile.findUnique({ where: { id: uid } });
      } catch (e) {}

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

      const parsedManualWeight = p.manualWeight !== null ? Number(p.manualWeight) : null;
      let weightSource: 'measured' | 'manual' | 'missing' = 'missing';
      let currentWeightValue = null;
      
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
        // Canonical shape mapping
        height: p.heightCm !== null ? Number(p.heightCm) : (pPrisma?.height || null),
        dateOfBirth: p.dateOfBirth || null,
        sex: p.sex || null,
        timezone: p.timezone || null,
        country: p.country || null,
        weight: weightObj,
        baseWeight: pPrisma?.baseWeight || null,
        mainGoal: pPrisma?.mainGoal || null,
        activeAnalysisId: p.activeAnalysisId,
        household: p.householdData || null
      };
    } catch (err) {
      console.warn(`[getProfileByUid] Validation or lookup error for ${uid}, treating as missing:`, err.message);
      return null;
    }
  }

  /**
   * Inicializar perfil para utilizador autenticado via Supabase sem perfil no backend.
   * Cria o User e o UserProfile com valores base seguros.
   */
  async initializeProfile(uid: string, email: string, displayName?: string) {
    // Upsert the base User record
    const user = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: uid,
        email,
        name: displayName || email.split('@')[0],
        dateOfBirth: new Date('1990-01-01'),
        sex: 'other',
        country: 'PT',
        timezone: 'Europe/Lisbon',
        passwordHash: 'SUPABASE_MANAGED',
        role: UserRole.END_USER,
      },
    });

    // Verify that the User's id matches the Supabase uid
    // If the User already existed with a different id, we need to look up by uid directly
    const existingById = await this.prisma.user.findUnique({ where: { id: uid } });
    const targetUserId = existingById ? uid : user.id;

    // Upsert the UserProfile
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
