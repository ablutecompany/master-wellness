import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiGatewayService } from './ai-gateway.service';

(async () => {
  const config = new ConfigService();
  // Load .env automatically via ConfigModule (already configured globally)
  const prisma = new PrismaService();
  const service = new AiGatewayService(prisma, config);
  try {
    const result = await service.testOpenAI();
    console.log('✅ OpenAI connection successful');
    console.log('Message:', result.message);
    console.log('Full response:', JSON.stringify(result.full_response, null, 2));
  } catch (err) {
    console.error('❌ OpenAI connection failed', err);
    process.exit(1);
  }
})();
