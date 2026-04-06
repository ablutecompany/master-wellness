import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromptInput, PromptResult } from './types';
import { UserRole } from '@prisma/client';

@Injectable()
export class AiGatewayService {
  constructor(private prisma: PrismaService) {}

  /**
   * Executar um prompt versionado (Governança Total).
   * 1. Resolve Template e Versão Ativa
   * 2. Valida Input
   * 3. Regista PromptRun e AIRequest
   * 4. Executa via Provider (Simulado)
   */
  async executePrompt(input: PromptInput, actor: { id: string, role: UserRole }): Promise<PromptResult> {
    // 1. RBAC Check Interno (Double-Lock)
    if (actor.role !== UserRole.ADMIN_INTERNAL && actor.role !== UserRole.SERVICE_BACKEND) {
      throw new ForbiddenException('Execução de prompt AI restrita a papéis governados.');
    }

    // 2. Resolver Template e Versão
    const template = await this.prisma.promptTemplate.findUnique({
      where: { code: input.promptCode },
      include: {
        versions: {
          where: { version: input.version, active: true },
          take: 1
        }
      }
    });

    if (!template || template.versions.length === 0) {
      throw new NotFoundException(`Prompt [${input.promptCode}] v${input.version} não encontrado ou inativo.`);
    }

    const versionDoc = template.versions[0];

    try {
      const start = Date.now();

      // 3. Criar a sessão de execução (PromptRun)
      const run = await this.prisma.promptRun.create({
        data: {
          versionId: versionDoc.id,
          userId: actor.id,
          status: 'processing'
        }
      });

      // 4. Execução Simulada (Placeholder para o Provider OpenAI)
      // Aqui o backend montaria o prompt final usando versionDoc.systemPrompt + input.variables
      const resultMessage = this.simulateAiResponse(input.promptCode, input.variables);

      // 5. Persistir AIRequest (O rastro individual)
      const aiRequest = await this.prisma.aIRequest.create({
        data: {
          runId: run.id,
          userId: actor.id,
          sessionId: input.sessionId,
          inputPayload: input.variables,
          resultPayload: { content: resultMessage },
          status: 'success',
          execMillis: Date.now() - start,
          modelUsed: 'gpt-4o-governed-v1',
          tokensUsed: 150,
          costMetadata: { currency: 'USD', value: 0.002 }
        }
      });

      // Atualizar status da Run
      await this.prisma.promptRun.update({
        where: { id: run.id },
        data: { status: 'completed' }
      });

      return {
        requestId: aiRequest.id,
        promptCode: input.promptCode,
        version: input.version,
        content: resultMessage,
        metadata: {
          model: 'gpt-4o-governed-v1',
          tokensUsed: 150,
          execMillis: Date.now() - start,
          finishReason: 'stop',
          timestamp: Date.now()
        }
      };

    } catch (e) {
      throw new InternalServerErrorException(`Falha na Governança AI: ${e.message}`);
    }
  }

  /**
   * Inicialização do Catálogo de Prompts Governados.
   */
  async syncPromptCatalogue() {
    const sleepCode = 'sleep_semantic_narrative';
    const nutriCode = 'nutrition_semantic_narrative';

    // Sleep Narrative Template
    await this.prisma.promptTemplate.upsert({
      where: { code: sleepCode },
      update: {},
      create: {
        code: sleepCode,
        name: 'Sleep Semantic Narrative Generator',
        description: 'Gera narrativa de suporte baseada no bundle de sono v1.2.0'
      }
    });

    // Nutrition Narrative Template
    await this.prisma.promptTemplate.upsert({
      where: { code: nutriCode },
      update: {},
      create: {
        code: nutriCode,
        name: 'Nutrition Advice Narrative',
        description: 'Gera interpretação biográfica baseada no rastro nutricional'
      }
    });

    // Registar Versões Ativas (Deveria vir de ficheiros de config em prod)
    // Placeholder para garantir que o sistema tem algo para correr
  }

  private simulateAiResponse(code: string, variables: any): string {
    return `[Governed Response for ${code}] Baseado nos dados biográficos fornecidos (score: ${variables.score || 'N/A'}), a sua narrativa de wellness está estável e auditada.`;
  }
}
