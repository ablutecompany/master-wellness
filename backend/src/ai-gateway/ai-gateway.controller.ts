import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Query,
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
   * POST /ai-gateway/generate-v2
   * Endpoint dedicado à Leitura AI R5B/R5C (Holística)
   */
  @Post('generate-v2')
  @HttpCode(HttpStatus.OK)
  async generateInsightsV2(@Request() req: any, @Body() body: any) {
    try {
      // Allow optional token extraction if not using global Guard
      let userId: string | undefined;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
         // Manual simple decode for this endpoint if no Guard is used, or just rely on a Guard.
         // Actually, let's just use the service to handle auth logic if needed, 
         // but if it's protected by JwtAuthGuard, we get req.user.
         // Wait, the client sends token in Authorization header.
         // Let's rely on standard Auth service if possible, or just require JwtAuthGuard but make it optional if we write a custom guard. 
         // Since demo users have no token, we can't use a strict JwtAuthGuard here if we want Demo to hit the same endpoint.
         // So we extract it manually:
         try {
           const tokenStr = authHeader.split(' ')[1];
           const payloadStr = Buffer.from(tokenStr.split('.')[1], 'base64').toString();
           const payload = JSON.parse(payloadStr);
           userId = payload.sub || payload.userId;
         } catch(e) {}
      }

      return await this.service.generateInsightsV2(body, userId);
    } catch (err) {
      if (err instanceof AiGatewayError) {
        return { ok: false, error: { code: err.code, message: err.message, details: err.details } };
      }
      return { ok: false, error: { code: 'INTERNAL_ERROR', message: (err as Error).message || 'Erro inesperado' } };
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
  /**
   * GET /ai-gateway/readings/history
   * Obtém o histórico longitudinal de leituras AI do utilizador.
   * Requer autenticação (JWT).
   */
  @UseGuards(JwtAuthGuard)
  @Get('readings/history')
  async getReadingHistory(@Request() req: any, @Query('includeDemo') includeDemo?: string) {
    try {
      const userId = req.user.userId;
      const isDemo = includeDemo === 'true';
      const result = await this.service.getAiReadingHistory(userId, { includeDemo: isDemo });
      return { ok: true, readings: result };
    } catch (err) {
      if (err instanceof AiGatewayError) {
        return { ok: false, error: { code: err.code, message: err.message, details: err.details } };
      }
      return { ok: false, error: { code: 'INTERNAL_ERROR', message: (err as Error).message || 'Erro inesperado ao obter histórico' } };
    }
  }
}
