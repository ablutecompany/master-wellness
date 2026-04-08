import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';

@Module({
  providers: [AiGatewayService],
  controllers: [AiGatewayController],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}

import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AiGatewayService],
  controllers: [AiGatewayController],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
