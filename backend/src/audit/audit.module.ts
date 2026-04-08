import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AuditController],
  providers: [AuditService, PrismaService],
  exports: [AuditService],
})
export class AuditModule {}
