# AI Reading — Contrato OpenAI (R2)

## 1. Contexto e Desalinhamento
Anteriormente (R1), o backend usava um schema strict da OpenAI focado em 4 domínios rígidos (`energia_disponibilidade`, `recuperacao_resiliencia`, `digestao_trato_intestinal`, `ritmo_renovacao`), devolvendo `headline`, `summary`, `domains` e `suggestions`.

Contudo, a UI da Leitura AI evoluiu para a versão R2, exigindo 8 eixos temáticos e uma estrutura muito mais rica e flexível, incluindo:
- `summary` (com title, text e confidence)
- `dimensions` (os eixos com score numérico)
- `highlightedThemes` (temas em destaque com limitação de status)
- `priorityActions` (ações prioritárias separadas por domínio)
- `watchSignals` (sinais a acompanhar futuramente)
- `references` e `readingLimits` (metadados importantes de limitação da IA)

## 2. Decisão Tomada: Schema R2 Direto (Opção A)
Decidiu-se atualizar o backend (`backend/src/ai-gateway/ai-gateway.service.ts`) para gerar o schema R2 nativamente. Esta é a opção mais limpa e future-proof.
A versão do prompt subiu para `2.0.0-canonical-r2`, forçando a OpenAI a devolver exatamente a estrutura que o frontend R2 espera.
Não foi ativada a chamada real no frontend (mantendo-se o motor local em funcionamento). Foi criado um `normalizeAIReadingResponse` no frontend para garantir que quando a integração for ligada, o JSON retornado será imune a falhas caso a API falhe campos.

## 3. Os 8 Temas no Contrato R2
A OpenAI foi instruída a usar estritamente os seguintes IDs e labels (em PT-PT):
1. Energia & disponibilidade (`energy_availability`)
2. Recuperação & carga (`recovery_load`)
3. Hidratação & equilíbrio urinário (`hydration_urinary_balance`)
4. Estado intestinal (`intestinal_state`)
5. Sinais vitais & equilíbrio fisiológico (`vital_signs_physiological_balance`)
6. Nutrição orientada por sinais
7. Stress, foco & autorregulação
8. Sinais a acompanhar

*(Os temas 1-5 são forçados em `dimensions`. Os temas 1-7 podem surgir em `highlightedThemes` e `priorityActions`. O tema 8 destina-se a `watchSignals`.)*

## 4. O Novo JSON Schema Strict
O `insightsSchema` do backend foi completamente reescrito para respeitar as chaves:
- `summary`: objeto `title`, `text`, `confidence`
- `dimensions`: array (score, label, explanation, etc.)
- `highlightedThemes`: array (status: optimal/caution/insufficient)
- `priorityActions`: array (reason, priority, domain)
- `watchSignals`: array
- `references` / `readingLimits`: metadados de contexto obrigatórios.

## 5. Normalização (Adapter Seguro)
Foi criado o ficheiro `src/services/semantic-output/ai-reading-adapter.ts` que exporta `normalizeAIReadingResponse(raw)`. 
Esta função recebe o output do backend e garante que todas as arrays existem, limita os items de temas e ações, e aplica fallbacks para campos em falta ou errados (ex: mapeamento seguro de `confidence` e `status`), prevenindo quebras (crashes) na UI.

## 6. Próximos Passos
Quando estivermos prontos para ligar a chamada real:
1. Em `src/services/ai-gateway/client.ts`, garantir que o resultado de `generateInsights` passa pelo `normalizeAIReadingResponse`.
2. Em `src/screens/AIReadingScreen.tsx` ou no seu engine, ler a flag `aiInsight` do store em vez do cálculo local.
3. Testar em Demo e Real.
