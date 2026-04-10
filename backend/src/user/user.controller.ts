import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

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
