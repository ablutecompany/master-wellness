import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import type { PromptInput } from './types';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('ai-gateway')
@UseGuards(AuthGuard, RolesGuard)
export class AiGatewayController {
  constructor(private service: AiGatewayService) {}

  /**
   * Executar um prompt versionado (Governança Total).
   * Restrito a papéis administrativos e serviços autorizados.
   */
  @Post('execute')
  @Roles(UserRole.ADMIN_INTERNAL, UserRole.SERVICE_BACKEND)
  async executePrompt(@Body() input: PromptInput, @Req() req: any) {
    // O rastro biográfico e operacional do executor (ID e Role) é capturado
    const actor = {
      id: req.user.id,
      role: req.user.role
    };

    return this.service.executePrompt(input, actor);
  }
}
