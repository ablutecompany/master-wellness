# OpenAI Prompt V2 Plan

## Objetivo
Preparar o contexto (LLM Context V2) para o motor OpenAI, suportando a nova arquitectura de 8 dimensões holísticas.

## Contrato de Entrada (Input)
O LLM receberá o seguinte objecto em JSON:
```json
{
  "sourceOrigin": "demo | real",
  "isDemo": true,
  "analysisDate": "2026-05-01T10:00:00Z",
  "activeObjectives": [],
  "visibleDimensions": [
    {
      "id": "readiness_today",
      "title": "Prontidão de hoje",
      "score": 85,
      "confidence": "high",
      "status": "stable",
      "topDrivers": [],
      "recommendations": [],
      "references": [],
      "limitations": []
    }
    // ... outras 7 dimensões
  ],
  "topGlobalDrivers": [],
  "dataQuality": "medium",
  "missingData": [],
  "historySummary": "...",
  "safetyRules": ["No clinical diagnosis", "Use Portuguese"],
  "language": "pt-PT"
}
```

## Contrato de Saída (Output)
A OpenAI NÃO deverá gerar scores matemáticos nem criar biomarcadores fictícios. O output esperado do LLM deve focar-se na interpretação semântica e na geração de recomendações formatadas (Narrativa), enriquecendo os `summary`, `recommendations` e `references` das dimensões, sem adulterar o array original base de `id`, `score` e `status`. O modelo deverá devolver:
- O resumo holístico global.
- O texto expandido para os "Resumos" de cada dimensão.
- Acções formatadas e fáceis de ler para as "Recomendações".

## Regras de Segurança
- Não inventar dados nem mascarar "missingData".
- Não criar correlações clínicas absolutas.
- Se `isDemo === true`, aceitar o prompt como simulação. A AI não deve reportar que os dados são perigosos, mas deve incluir uma disclaimer "demo_data_not_for_real_longitudinal_use" no campo de limitações de forma invisível/estruturada para a UI, nunca alarmando o utilizador em Demo.
- Histórico: `historySummary` não deverá incluir dados gerados em sessões `demo`. O Backend filtrará antes da injeção.
- Escrita: português de Portugal (pt-PT). Tom construtivo e pragmático (não paternalista).
