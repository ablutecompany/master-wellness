import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(actorType: string, actorId: string, eventType: string, targetType?: string, targetId?: string, payload?: any) {
    return this.prisma.auditEvent.create({
      data: {
        actorType,
        actorId,
        eventType,
        targetType,
        targetId,
        payload,
      },
    });
  }

  /**
   * Log specialized health insight consumption for auditability.
   */
  async logInsightConsumption(userId: string, domain: string, insightId: string, bundleVersion: string, action: 'viewed' | 'tapped' = 'viewed') {
    return this.log(
      'user',
      userId,
      `insight_${action}`,
      'domain_insight',
      insightId,
      { domain, bundleVersion, timestamp: new Date().toISOString() }
    );
  }
}
