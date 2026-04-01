import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validar credenciais e gerar sessão.
   * Foco em base técnica segura (JWT ou Bearer Token persistido).
   */
  async login(email: string, passwordHash: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    if (!user || user.passwordHash !== passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Criar sessão persistente (vão para a nova tabela Session)
    const token = `sk_${Math.random().toString(36).substring(2)}${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias de validade

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        clientInfo: 'shell_base_v1.2'
      }
    });

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  /**
   * Verificar se uma sessão é válida e devolver o utilizador com o seu papel.
   */
  async validateSession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Sessão expirada ou inválida');
    }

    // Actualizar última actividade
    await this.prisma.session.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() }
    });

    return session.user;
  }
}
