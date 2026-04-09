import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';

@Module({
  providers: [AiGatewayService],
  controllers: [AiGatewayController],
  exports: [AiGatewayService],
})
export class AiGatewayModule {}
