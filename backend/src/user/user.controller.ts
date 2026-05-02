import { Controller, Patch, Get, Body, UseGuards, Request } from '@nestjs/common';
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
    @Body() body: { 
      name?: string; 
      avatarUrl?: string; 
      dateOfBirth?: string; 
      dateOfBirthPrecision?: string; 
      height?: number; 
      sex?: string; 
      timezone?: string; 
      country?: string; 
      weight?: { manualValue?: number | null };
      goals?: string[];
      activityLevel?: string;
      dietaryRestrictions?: string[];
    },
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

  /**
   * Obtém o Household (Agregado) do utilizador.
   * Rota: GET /user/household
   */
  @UseGuards(JwtAuthGuard)
  @Get('household')
  async getHousehold(@Request() req: any) {
    const userId = req.user.userId;
    const household = await this.userService.getHousehold(userId);
    return { ok: true, household };
  }

  /**
   * Substitui/actualiza o Household (Agregado) do utilizador.
   * Rota: PATCH /user/household
   */
  @UseGuards(JwtAuthGuard)
  @Patch('household')
  async patchHousehold(@Request() req: any, @Body() body: any) {
    const userId = req.user.userId;
    const household = await this.userService.patchHousehold(userId, body);
    return { ok: true, household };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('household/invite')
  async createInvite(@Request() req: any, @Body() body: { memberId: string, email: string }) {
    const userId = req.user.userId;
    const household = await this.userService.createInvite(userId, body.memberId, body.email);
    return { ok: true, household };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('household/accept-invite')
  async acceptInvite(@Request() req: any, @Body() body: { inviteId: string }) {
    const userId = req.user.userId;
    const household = await this.userService.acceptInvite(userId, body.inviteId);
    return { ok: true, household };
  }
}
