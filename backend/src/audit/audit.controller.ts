import { Controller, Post, Body, Req } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Post('consumption')
  async trackConsumption(
    @Body() body: { 
      userId: string; 
      domain: string; 
      insightId: string; 
      bundleVersion: string;
      action?: 'viewed' | 'tapped';
    }
  ) {
    const { userId, domain, insightId, bundleVersion, action = 'viewed' } = body;
    
    // Rastro de Auditoria: Log imediato de consumo biográfico
    await this.auditService.logInsightConsumption(
      userId, 
      domain, 
      insightId, 
      bundleVersion, 
      action
    );

    return { 
      status: 'logged', 
      domain, 
      insightId, 
      timestamp: new Date().toISOString() 
    };
  }
}
