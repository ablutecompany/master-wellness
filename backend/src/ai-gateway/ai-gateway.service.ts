import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PromptInput, PromptResult } from './types';

@Injectable()
export class AiGatewayService {
  constructor(private prisma: PrismaService) {}

  /**
   * Executar um prompt versionado (Gouvernance Framework).
   * O frontend envia apenas o código e as variáveis; o prompt real vive no backend.
   */
  async executePrompt(input: PromptInput): Promise<PromptResult> {
    const promptRun = await this.prisma.promptRun.findUnique({
      where: { code: input.promptCode }
    });

    if (!promptRun || promptRun.version !== input.version) {
      throw new Error(`Prompt [${input.promptCode}] versão [${input.version}] não existe.`);
    }

    try {
      /**
       * Simulação do futuro pipeline OpenAI:
       * 1. Montar prompt final (System + User + Context)
       * 2. Chamar OpenAI via SDK protegida
       * 3. Validar Schema de output
       * 4. Persistir rastro
       */
       
      const start = Date.now();
      
      // Placeholder para o conteúdo resultante (v1.2.0 compatibility)
      const simulatedResult = {
        message: `Resultado gerado para ${input.promptCode}`,
        variables: input.variables
      };

      const aiRequest = await this.prisma.aiRequest.create({
        data: {
          userId: input.userId,
          sessionId: input.sessionId,
          promptId: promptRun.id,
          inputPayload: input.variables,
          resultPayload: simulatedResult,
          status: 'success',
          execMillis: Date.now() - start,
          modelUsed: 'gpt-4o-schema-governed'
        }
      });

      return {
        requestId: aiRequest.id,
        promptCode: input.promptCode,
        version: input.version,
        content: simulatedResult,
        metadata: {
          model: 'gpt-4o-schema-governed',
          tokensUsed: 42,
          execMillis: Date.now() - start,
          finishReason: 'stop',
          timestamp: Date.now()
        }
      };

    } catch (e) {
      throw new InternalServerErrorException(`Falha na gateway AI: ${e.message}`);
    }
  }
}
