import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      // Evita o crash imediato em ambiente de testes locais focado apenas noutros módulos
      if (!process.env.DATABASE_URL) {
        this.logger.warn('DATABASE_URL ausente. Prisma não foi inicializado.');
        return;
      }
      await this.$connect();
      this.logger.log('Prisma conectado com sucesso à DB.');
    } catch (err) {
      this.logger.error('Falha ao ligar Prisma no arranque. Ignorando para permitir subida parcial.', err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
