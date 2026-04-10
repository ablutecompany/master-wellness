import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // --- CONFIGURAÇÃO DE CORS — M6 Fatia 1 ---
  const allowedOriginsString = configService.get<string>('CORS_ALLOWED_ORIGINS') || '';
  const allowedOrigins = allowedOriginsString.split(',').map(o => o.trim());
  const originRegexString = configService.get<string>('CORS_ALLOWED_ORIGIN_REGEX');
  const originRegex = originRegexString ? new RegExp(originRegexString) : null;

  app.enableCors({
    origin: (origin, callback) => {
      // Se não houver origin (ex: mobile apps ou server-to-server), permitir
      if (!origin) return callback(null, true);

      // 1. Verificar lista explícita
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 2. Verificar Regex (útil para Preview/Staging)
      if (originRegex && originRegex.test(origin)) {
        return callback(null, true);
      }

      // Bloquear se não coincidir
      callback(new Error('Origin not allowed by CORS Policy'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = configService.get<number>('PORT') || 3000;
  const env = configService.get<string>('NODE_ENV') || 'development';
  
  await app.listen(port);
  console.log(`Backend operacional na porta ${port} [Ambiente: ${env}]`);
}
bootstrap();
