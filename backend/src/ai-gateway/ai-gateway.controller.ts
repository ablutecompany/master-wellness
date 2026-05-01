import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiGatewayService, AiGatewayError } from './ai-gateway.service';
import { GenerateInsightsDto } from './dto/generate-insights.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Controller do AI Gateway.
 * Sem auth (provisório). Retorna shape canónico estável.
 */
@Controller('ai-gateway')
export class AiGatewayController {
  constructor(private readonly service: AiGatewayService) {}

  /**
   * POST /ai-gateway/generate-insights
   *
   * Sucesso: { ok: true, provider, model, insight, meta }
   * Erro:    { ok: false, error: { code, message, details? } }
   */
  @Post('generate-insights')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async generateInsights(@Body() dto: GenerateInsightsDto) {
    try {
      return await this.service.generateInsights(dto);
    } catch (err) {
      if (err instanceof AiGatewayError) {
        return {
          ok: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details ?? undefined,
          },
        };
      }
      return {
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: (err as Error).message || 'Erro inesperado no servidor',
        },
      };
    }
  }

  /**
   * POST /ai/readings/generate
   * Novo endpoint estruturado para Leitura AI (Modo Híbrido)
   */
  @UseGuards(JwtAuthGuard)
  @Post('../ai/readings/generate')
  @HttpCode(HttpStatus.OK)
  async generateAiReading(@Request() req: any, @Body() body: any) {
    try {
      const userId = req.user.userId;
      const result = await this.service.generateOrReuseAiReading(body, userId);
      return { ok: true, data: result };
    } catch (err) {
      if (err instanceof AiGatewayError) {
        return { ok: false, error: { code: err.code, message: err.message, details: err.details } };
      }
      return { ok: false, error: { code: 'INTERNAL_ERROR', message: (err as Error).message || 'Erro inesperado' } };
    }
  }
}
