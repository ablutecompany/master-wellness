import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analyses')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  /**
   * Listar todas as análises reais do utilizador autenticado.
   * Rota: GET /analyses
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAnalyses(@Request() req: any) {
    // userId extraído do JWT via JwtStrategy (payload.sub)
    const userId = req.user.userId;
    return this.analysisService.listForUser(userId);
  }
}
