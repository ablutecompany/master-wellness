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
      const profiles = await this.prisma.$queryRaw<any[]>`
        SELECT id, email, name, active_analysis_id as "activeAnalysisId"
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

      return {
        id: p.id,
        email: p.email,
        name: p.name,
        // Canonical shape mapping
        goals: pPrisma?.secondaryGoals || [],
        height: pPrisma?.height || null,
        baseWeight: pPrisma?.baseWeight || null,
        mainGoal: pPrisma?.mainGoal || null,
        activeAnalysisId: p.activeAnalysisId,
        // ... include any other fields needed by frontend
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
