import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  async onModuleInit() {
    try {
      let dbUrl = process.env.DATABASE_URL;
      
      if (!dbUrl) {
        this.logger.warn('DATABASE_URL ausente. Ligação Prisma ignorada.');
        return;
      }

      // Self-healing da Connection String para PGBouncer (Transaction Pooler) em ambientes limitados a IPv4 (Render)
      if (dbUrl.includes('db.wyddxokuugxwwigzvoja.supabase.co')) {
        this.logger.log('Detetado host Supabase Legacy/Direct. A ajustar automaticamente para o Transaction Pooler (IPv4)...');
        
        // Substituir Host
        dbUrl = dbUrl.replace('db.wyddxokuugxwwigzvoja.supabase.co:5432', 'aws-0-eu-central-1.pooler.supabase.com:6543');
        
        // Adicionar project ID ao utilizador (postgresql://postgres: -> postgresql://postgres.wyddxokuugxwwigzvoja:)
        if (!dbUrl.includes('postgres.wyddxokuugxwwigzvoja')) {
          dbUrl = dbUrl.replace('postgres:', 'postgres.wyddxokuugxwwigzvoja:');
        }
        
        // Assegurar pgbouncer
        if (!dbUrl.includes('pgbouncer=true')) {
          dbUrl += dbUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
        }
        
        process.env.DATABASE_URL = dbUrl;
        this.logger.log('Connection Pooler URL configurado em runtime.');
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
