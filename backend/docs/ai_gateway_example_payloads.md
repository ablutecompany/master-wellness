# AI Gateway — Example Payloads

## 1. Request mínimo (1 medição)

```json
{
  "analysisId": "test-001",
  "selectedDate": "2026-04-08",
  "measurements": [
    {
      "type": "urinalysis",
      "marker": "pH Urinário",
      "value": "6.5",
      "unit": "pH"
    }
  ],
  "events": [],
  "ecosystemFacts": [],
  "isDemo": false
}
```

---

## 2. Request completo (multi-categoria)

```json
{
  "analysisId": "analysis-full-001",
  "selectedDate": "2026-04-08",
  "measurements": [
    { "type": "urinalysis", "marker": "pH Urinário", "value": "6.5", "unit": "pH" },
    { "type": "urinalysis", "marker": "Gravidade Específica", "value": "1.015", "unit": "g/mL" },
    { "type": "urinalysis", "marker": "Proteínas", "value": "negativo", "unit": "mg/dL" },
    { "type": "urinalysis", "marker": "Glicose", "value": "negativo", "unit": "mg/dL" },
    { "type": "urinalysis", "marker": "Nitritos", "value": "negativo", "unit": "" },
    { "type": "urinalysis", "marker": "Corpos Cetónicos", "value": "negativo", "unit": "" },
    { "type": "urinalysis", "marker": "Creatinina", "value": "120", "unit": "mg/dL" },
    { "type": "ecg", "marker": "Ritmo Cardíaco", "value": "68", "unit": "bpm" },
    { "type": "ppg", "marker": "SpO2", "value": "98", "unit": "%" },
    { "type": "ppg", "marker": "HRV Estimada", "value": "42", "unit": "ms" },
    { "type": "temp", "marker": "Temperatura", "value": "36.4", "unit": "°C" },
    { "type": "fecal", "marker": "Bristol", "value": "Tipo 4", "unit": "" }
  ],
  "events": [
    {
      "type": "sleep_duration_logged",
      "value": "7h 12m",
      "sourceAppId": "apple_health"
    }
  ],
  "ecosystemFacts": [],
  "isDemo": false
}
```

---

## 3. Request demo

```json
{
  "analysisId": "demo-healthy-001",
  "selectedDate": "2026-04-08",
  "measurements": [
    { "type": "urinalysis", "marker": "pH Urinário", "value": "6.5", "unit": "pH" },
    { "type": "urinalysis", "marker": "Gravidade Específica", "value": "1.015", "unit": "g/mL" },
    { "type": "ecg", "marker": "Ritmo Cardíaco", "value": "65", "unit": "bpm" },
    { "type": "temp", "marker": "Temperatura", "value": "36.6", "unit": "°C" }
  ],
  "events": [],
  "ecosystemFacts": [],
  "isDemo": true,
  "demoScenarioKey": "healthy_baseline"
}
```

---

## 4. Response esperada (sucesso)

```json
{
  "status": "success",
  "payload": {
    "headline": "Marcadores biológicos dentro dos parâmetros normais",
    "summary": "Os indicadores urinários e fisiológicos apontam para um estado de equilíbrio metabólico e hidratação adequada.",
    "domains": {
      "energia_disponibilidade": "Capacidade energética funcional detectada sem sinais de défice calórico ou sobrecarga.",
      "recuperacao_resiliencia": "Indicadores de recuperação autonómica dentro dos valores funcionais.",
      "digestao_trato_intestinal": "Perfil urinário sem marcadores de stress digestivo.",
      "ritmo_renovacao": "Parâmetros basais dentro dos limites esperados para regeneração celular."
    },
    "suggestions": [
      "Manter ingestão hídrica acima de 2L diários",
      "Registar duração de sono para análise mais completa"
    ]
  }
}
```

---

## 5. Response esperada (erro)

```json
{
  "statusCode": 500,
  "message": "Falha ao gerar insights: Request failed with status code 401"
}
```

---

## Notas sobre shapes

### DTO vs Schema Supabase (divergências)

| Campo DTO | Campo Schema Supabase | Divergência |
|-----------|----------------------|-------------|
| `measurements[].type` | `analysis_measurements.category` | Nome diferente |
| `measurements[].marker` | `analysis_measurements.metric_key` | Nome diferente |
| `measurements[].value` | `analysis_measurements.value_text` / `value_numeric` | Campo único vs split |
| `events[].type` | `analysis_events.event_type` | Nome diferente |
| `events[].value` | — | Não existe no schema (está em `payload`) |
| `events[].sourceAppId` | — | Não existe no schema (está em `payload`) |
| `ecosystemFacts` | — | Não existe como tabela separada (usa `analysis_events` ou `analysis_measurements` com category `ecossistema`) |

### Domains OpenAI vs Domains analysis-engine local

| OpenAI schema (service) | Analysis-engine local | Compatível |
|------------------------|----------------------|-----------|
| `energia_disponibilidade` | `energy` | Não |
| `recuperacao_resiliencia` | `recovery` | Não |
| `digestao_trato_intestinal` | `nutrition` / `general` | Não |
| `ritmo_renovacao` | — | Não existe localmente |
| — | `sleep` | Não existe no OpenAI schema |
| — | `performance` | Não existe no OpenAI schema |
