import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Health Check Simples (M8 - Liveness).
   * Resposta imediata, sem dependências externas.
   */
  @Get()
  check() {
    return {
      ok: true,
      timestamp: new Date().toISOString(),
      service: 'ablute-wellness-backend',
    };
  }

  /**
   * Diagnóstico de Build (Obrigatório para Auditoria P0).
   * Expõe a versão em runtime para garantir que o CI/CD (Render)
   * atualizou corretamente para o commit correto.
   */
  @Get('version')
  version() {
    return {
      service: 'ablute-wellness-backend',
      commit: process.env.RENDER_GIT_COMMIT || 'local',
      branch: process.env.RENDER_GIT_BRANCH || 'local',
      buildTime: process.env.TIMESTAMP || new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Readiness Check (M8 - Readiness).
   * Valida dependências críticas de forma assertiva.
   */
  @Get('ready')
  async readiness() {
    const checks = {
      db: false,
      supabase: !!this.config.get('SUPABASE_URL'),
      openai: !!this.config.get('OPENAI_API_KEY'),
    };

    try {
      // Validação de Base de Dados com Timeout (5s)
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 5000))
      ]);
      checks.db = true;

      const allOk = checks.db && checks.supabase && checks.openai;

      const response = {
        ok: allOk,
        timestamp: new Date().toISOString(),
        BUILD_ACTIVE: 'FIX_BACKEND_NOME',
        checks: {
          db: checks.db ? 'connected' : 'failed',
          supabase: checks.supabase ? 'configured' : 'missing',
          openai: checks.openai ? 'configured' : 'missing',
        }
      };

      if (!allOk) {
        throw new ServiceUnavailableException(response);
      }

      return response;
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      
      throw new ServiceUnavailableException({
        ok: false,
        timestamp: new Date().toISOString(),
        error: err.message,
        checks
      });
    }
  }
}
