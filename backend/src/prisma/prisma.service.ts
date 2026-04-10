import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      if (!process.env.DATABASE_URL) {
        this.logger.warn('DATABASE_URL ausente. Ligação Prisma ignorada.');
        return;
      }

      await this.$connect();
      this.isConnected = true;
      this.logger.log('Prisma conectado com sucesso à DB.');
    } catch (err) {
      this.isConnected = false;
      this.logger.error('Falha ao ligar Prisma no arranque. A aplicação continuará para diagnóstico parcial.', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.isConnected = false;
  }

  getConnectedStatus() {
    return this.isConnected;
  }
}
