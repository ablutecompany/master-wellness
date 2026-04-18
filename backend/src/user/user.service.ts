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
    
    // Update name in User table
    if (name !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    // Update secondaryGoals in UserProfile table
    if (goals !== undefined) {
      await this.prisma.userProfile.upsert({
        where: { id: userId },
        update: { secondaryGoals: goals },
        create: { id: userId, secondaryGoals: goals },
      });
    }

    // Return the updated canonical profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) throw new Error('User not found after update');

    const p = user.profile;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      goals: p?.secondaryGoals || [],
      height: p?.height || null,
      baseWeight: p?.baseWeight || null,
      mainGoal: p?.mainGoal || null,
      activeAnalysisId: p?.activeAnalysisId,
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
