import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * Actualiza dados do perfil (Nome, Objectivos, etc).
   * Rota: PATCH /user/profile
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; goals?: string[] },
  ) {
    const userId = req.user.userId;
    // Update raw records in DB
    await this.userService.updateCombinedProfile(userId, body);
    
    // We expect the frontend to call GET /auth/me to rehydrate,
    // but we can return ok: true.
    return { ok: true };
  }

  /**
   * Actualiza a análise activa do utilizador.
   * Rota: PATCH /user/profile/active-analysis
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile/active-analysis')
  async updateActiveAnalysis(
    @Request() req: any,
    @Body() body: { analysisId: string | null },
  ) {
    // O userId é extraído do token JWT pelo JwtAuthGuard (validado no JwtStrategy)
    const userId = req.user.userId;
    return this.userService.updateActiveAnalysis(userId, body.analysisId);
  }
}
