import { Body, Controller, Post } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { GenerateInsightsDto } from './dto/generate-insights.dto';

/** Minimal controller – no guards, no auth, no extra logic */
@Controller('ai-gateway')
export class AiGatewayController {
  constructor(private readonly service: AiGatewayService) {}

  /** POST /ai-gateway/generate-insights */
  @Post('generate-insights')
  async generateInsights(@Body() payload: GenerateInsightsDto) {
    return this.service.generateInsights(payload);
  }
}

import { AiGatewayService } from './ai-gateway.service';
import { GenerateInsightsDto } from './dto/generate-insights.dto';

/** Minimal controller – no guards, no auth, no extra logic */
@Controller('ai-gateway')
export class AiGatewayController {
  constructor(private readonly service: AiGatewayService) {}

  /** POST /ai-gateway/generate-insights */
  @Post('generate-insights')
  async generateInsights(@Body() payload: GenerateInsightsDto) {
    return this.service.generateInsights(payload);
  }
}

import { AiGatewayService } from './ai-gateway.service';
import { GenerateInsightsDto } from './dto/generate-insights.dto';

@Controller('ai-gateway')
export class AiGatewayController {
  constructor(private service: AiGatewayService) {}


@Controller('ai-gateway')
export class AiGatewayController {
  constructor(private service: AiGatewayService) {}

  /**
   * Executar um prompt versionado (Governança Total).
   * Restrito a papéis administrativos e serviços autorizados.
   */
  @Post('execute')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_INTERNAL, UserRole.SERVICE_BACKEND)
  async executePrompt(@Body() input: PromptInput, @Req() req: any) {
    // O rastro biográfico e operacional do executor (ID e Role) é capturado
    const actor = {
      id: req.user.id,
      role: req.user.role
    };

    return this.service.executePrompt(input, actor);
  }

  /**
   * Ponto de Teste Público: Verifica se a OpenAI consegue responder a uma inferência trivial.
   * Não utilizar em produção (Auth bypass temporário para prova de conceito).
   */
  @Post('generate-insights')
  @Roles(UserRole.ADMIN_INTERNAL, UserRole.SERVICE_BACKEND)
  async generateInsights(@Body() payload: GenerateInsightsDto) {
    return this.service.generateInsights(payload);
  }

