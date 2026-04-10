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
   * Health Check Simples (processo está vivo).
   */
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ablute-wellness-backend',
    };
  }

  /**
   * Readiness Check (dependências críticas estão operacionais).
   * M6 Fatia 2
   */
  @Get('ready')
  async readiness() {
    const checks = {
      db: false,
      supabase: false,
      openai: false,
    };

    try {
      // 1. Verificar Conectividade DB (Real)
      await this.prisma.$queryRaw`SELECT 1`;
      checks.db = true;

      // 2. Verificar Config Supabase (Presença)
      const supabaseUrl = this.config.get('SUPABASE_URL');
      if (supabaseUrl) checks.supabase = true;

      // 3. Verificar Config OpenAI (Presença/Config Only)
      const openaiKey = this.config.get('OPENAI_API_KEY');
      if (openaiKey) {
        checks.openai = true;
      }

      const allOk = Object.values(checks).every(v => v === true);

      const response = {
        ok: allOk,
        timestamp: new Date().toISOString(),
        checks: {
          db: checks.db ? 'connected' : 'failed',
          supabase: checks.supabase ? 'configured' : 'missing',
          openai: {
            configured: checks.openai,
            checked: 'config_only'
          }
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
