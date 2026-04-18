import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    let dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('db.wyddxokuugxwwigzvoja.supabase.co')) {
      dbUrl = dbUrl.replace('db.wyddxokuugxwwigzvoja.supabase.co:5432', 'aws-0-eu-central-1.pooler.supabase.com:6543');
      if (!dbUrl.includes('postgres.wyddxokuugxwwigzvoja')) {
        dbUrl = dbUrl.replace('postgres:', 'postgres.wyddxokuugxwwigzvoja:');
      }
      if (!dbUrl.includes('pgbouncer=true')) {
        dbUrl += dbUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
      }
      process.env.DATABASE_URL = dbUrl; // Sync process env just in case
    }
    super(dbUrl ? { datasources: { db: { url: dbUrl } } } : undefined);
  }

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
