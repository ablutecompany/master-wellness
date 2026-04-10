import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Devolve o perfil do utilizador autenticado via Supabase.
   * Rota: GET /auth/me
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req: any) {
    // req.user foi preenchido pelo JwtStrategy.validate()
    const userId = req.user.userId;
    const profile = await this.authService.getProfileByUid(userId);
    
    return {
      ok: true,
      profile
    };
  }
}
