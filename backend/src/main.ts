import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // --- CONFIGURAÇÃO DE CORS ---
    const allowedOriginsString = configService.get<string>('CORS_ALLOWED_ORIGINS') || '';
    const allowedOrigins = allowedOriginsString.split(',').map(o => o.trim());
    const originRegexString = configService.get<string>('CORS_ALLOWED_ORIGIN_REGEX');
    const originRegex = originRegexString ? new RegExp(originRegexString) : null;

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (originRegex && originRegex.test(origin)) return callback(null, true);
        callback(new Error('Origin not allowed by CORS Policy'));
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    const port = configService.get<number>('PORT') || 3000;
    const env = configService.get<string>('NODE_ENV') || 'development';
    
    // Hardening: ouvir explicitamente em 0.0.0.0 para compatibilidade em cloud/contentores
    await app.listen(port, '0.0.0.0');
    logger.log(`Backend operacional na porta ${port} [Ambiente: ${env}]`);
  } catch (err) {
    logger.error('Falha fatal no bootstrap da aplicação', err.stack);
    process.exit(1);
  }
}

bootstrap();
