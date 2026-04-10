import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obter perfil do utilizador diretamente da tabela "profiles" via UUID do Supabase.
   */
  async getProfileByUid(uid: string) {
    return this.prisma.userProfile.findUnique({
      where: { id: uid }
    });
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
