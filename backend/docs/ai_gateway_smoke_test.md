# AI Gateway — Smoke Test

## Pré-requisitos
1. Backend NestJS a correr (`npm run start:dev` ou `npm run start`)
2. `OPENAI_API_KEY` válida no `.env`
3. Terminal ou ferramenta HTTP (curl, Postman, Insomnia)

---

## 1. Backend arranca sem erro
- [ ] Correr `npm run start:dev` no directório `backend/`
- [ ] Output contém `Nest application successfully started`
- [ ] Sem crash por `OPENAI_API_KEY não está definida`

## 2. Rota responde
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ai-gateway/generate-insights -X POST -H "Content-Type: application/json" -d "{}"
```
- [ ] HTTP status **não é** 404 (rota existe)
- [ ] Esperado: 500 (payload vazio causa erro no OpenAI)

## 3. Request com payload mínimo válido
```bash
curl -X POST http://localhost:3000/ai-gateway/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "test-001",
    "selectedDate": "2026-04-08",
    "measurements": [
      {"type": "urinalysis", "marker": "pH Urinário", "value": "6.5", "unit": "pH"}
    ],
    "events": [],
    "ecosystemFacts": [],
    "isDemo": false
  }'
```
- [ ] HTTP 200
- [ ] Body contém `"status": "success"`
- [ ] Body contém `"payload"` com objecto
- [ ] Payload contém `headline`, `summary`, `domains`, `suggestions`
- [ ] `domains` contém `energia_disponibilidade`, `recuperacao_resiliencia`, `digestao_trato_intestinal`, `ritmo_renovacao`
- [ ] `suggestions` é array de strings

## 4. Request com payload demo
```bash
curl -X POST http://localhost:3000/ai-gateway/generate-insights \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": "demo-001",
    "selectedDate": "2026-04-08",
    "measurements": [
      {"type": "urinalysis", "marker": "pH Urinário", "value": "6.5", "unit": "pH"},
      {"type": "urinalysis", "marker": "Gravidade Específica", "value": "1.015", "unit": "g/mL"},
      {"type": "ecg", "marker": "Ritmo Cardíaco", "value": "68", "unit": "bpm"},
      {"type": "temp", "marker": "Temperatura", "value": "36.4", "unit": "°C"},
      {"type": "fecal", "marker": "Bristol", "value": "Tipo 4", "unit": ""}
    ],
    "events": [
      {"type": "sleep_duration_logged", "value": "7h 12m", "sourceAppId": "apple_health"}
    ],
    "ecosystemFacts": [],
    "isDemo": true,
    "demoScenarioKey": "healthy_baseline"
  }'
```
- [ ] HTTP 200
- [ ] Body contém `"status": "success"`
- [ ] Payload em português de Portugal
- [ ] Nenhum campo do schema JSON está em falta

## 5. Erro com API key inválida
- [ ] Alterar `OPENAI_API_KEY` no `.env` para valor falso
- [ ] Reiniciar backend
- [ ] Repetir request do teste 3
- [ ] HTTP 500
- [ ] Body contém `"Falha ao gerar insights:"`
- [ ] Restaurar API key correcta

## 6. Verificar log do servidor
- [ ] Após teste 3 bem-sucedido, verificar stdout do backend
- [ ] Deve conter output do `console.dir(response)` com objecto completo da Responses API
- [ ] Verificar se `response.data` existe no dump ou se o campo real é `response.output_text`

## 7. Rota sem auth
- [ ] Request do teste 3 funciona sem qualquer header de auth
- [ ] Não há 401 ou 403
- [ ] Confirma que a rota está aberta (sem guards)

---

## Resultado
- [ ] 7/7 passam → gateway funcional para integração
- [ ] Algum falha → reportar qual e com output exacto

## Nota crítica
O teste 6 é fundamental: se `response.data` for `undefined` no dump, o service está a retornar `{ status: "success", payload: undefined }` — o que significa que o campo correcto da Responses API é `output_text`, não `data`, e o service precisa de correcção.
