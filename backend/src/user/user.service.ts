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

  async updateCombinedProfile(userId: string, updates: { name?: string, goals?: string[] }) {
    const { name, goals } = updates;
    
    // Update name directly in public.profiles since public.User doesn't exist
    if (name !== undefined) {
      await this.prisma.$executeRaw`
        UPDATE public.profiles 
        SET name = ${name}, updated_at = now()
        WHERE id = ${userId}::uuid
      `;
    }

    // Update secondaryGoals in UserProfile table
    if (goals !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { id: userId },
        update: { secondaryGoals: goals },
        create: { 
          id: userId, 
          secondaryGoals: goals,
          height: 0,
          baseWeight: 0,
          mainGoal: 'Manutenção',
          activityLevel: 'Moderado'
        },
      });
    }

    // Fetch the updated profile using raw query to avoid Prisma map crashes
    const profiles = await this.prisma.$queryRaw<any[]>`
      SELECT id, email, name, active_analysis_id as "activeAnalysisId"
      FROM public.profiles 
      WHERE id = ${userId}::uuid
    `;

    if (!profiles || profiles.length === 0) throw new Error('Profile not found after update in public.profiles');
    
    const p = profiles[0];

    // Try to gently fetch UserProfile (for goals/height) ignoring if it crashes due to missing DB columns
    let pPrisma: any = null;
    try {
       pPrisma = await this.prisma.userProfile.findUnique({ where: { id: userId } });
    } catch(e) {}

    return {
      id: p.id,
      email: p.email,
      name: p.name,
      goals: pPrisma?.secondaryGoals || [],
      height: pPrisma?.height || null,
      baseWeight: pPrisma?.baseWeight || null,
      mainGoal: pPrisma?.mainGoal || null,
      activeAnalysisId: p.activeAnalysisId,
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
