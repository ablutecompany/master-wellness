import { InternalServerErrorException as PIError, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('debug-db')
  getDebug() {
    return { url: process.env.DATABASE_URL };
  }

  /**
   * Devolve o perfil do utilizador autenticado via Supabase.
   * Rota: GET /auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any): Promise<any> {
    const userId = req.user.userId;
    const profile = await this.authService.getProfileByUid(userId);
    
    return {
      ok: true,
      profile
    };
  }

  /**
   * Inicializa o perfil de negócio para utilizador Supabase sem perfil no backend.
   * Cria User + UserProfile com valores base se ainda não existirem.
   * Rota: POST /auth/initialize
   */
  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  async initialize(@Request() req: any): Promise<any> {
    try {
      const userId = req.user.userId;
      const email = req.user.email;
      const profile = await this.authService.initializeProfile(userId, email);

      return {
        ok: true,
        profile
      };
    } catch (err) {
      return { ok: false, error: err.message, stack: err.stack };
    }
  }
}
