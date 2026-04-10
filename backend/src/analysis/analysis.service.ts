import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}

  /**
   * Listar todas as análises do utilizador com dados completos e formatados.
   * Ordenação: Análise mais recente primeiro.
   */
  async listForUser(userId: string) {
    const rawAnalyses = await this.prisma.analysis.findMany({
      where: { ownerId: userId, status: 'active' },
      include: {
        measurements: {
          orderBy: { displayOrder: 'asc' }
        },
        events: {
          orderBy: { occurredAt: 'desc' }
        }
      },
      orderBy: { analysisDate: 'desc' }
    });

    // Mapeamento intencional para o shape esperado pela UI
    return rawAnalyses.map(analysis => ({
      id: analysis.id,
      label: analysis.title,
      analysisDate: analysis.analysisDate.toISOString().split('T')[0],
      source: analysis.source,
      measurements: analysis.measurements.map(m => ({
        id: m.id,
        type: m.category, // No frontend, 'category' do SQL é o 'type'
        marker: m.metricKey, // 'metric_key' do SQL é o 'marker' para urinalysis/fecal
        value: this.formatValue(m.valueNumeric, m.valueText, m.unit),
        valueNumeric: m.valueNumeric,
        unit: m.unit,
        recordedAt: m.measuredAt.toISOString()
      })),
      ecosystemFacts: analysis.events.map(e => ({
        id: e.id,
        type: e.eventType,
        value: e.payload ? JSON.stringify(e.payload) : '',
        recordedAt: e.occurredAt.toISOString()
      })),
      createdAt: analysis.createdAt.toISOString()
    }));
  }

  /**
   * Regra de formatação: valor legível pronto para a UI.
   */
  private formatValue(numeric: number | null, text: string | null, unit: string | null): string {
    if (text) return text;
    if (numeric !== null) {
      return unit ? `${numeric} ${unit}` : `${numeric}`;
    }
    return '---';
  }
}
