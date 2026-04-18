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
    try {
      const userId = req.user.userId;
      // Update raw records in DB and return canonical shape
      const updatedProfile = await this.userService.updateCombinedProfile(userId, body);
      
      return { ok: true, profile: updatedProfile };
    } catch (err) {
      return { ok: false, ERROR_MARKER: 'RUNTIME_A_PROCESSAR', errorName: err.name, errorMessage: err.message, trace: err.stack };
    }
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
