# Runtime Runbook — ablute_ wellness

Este documento descreve o contrato de runtime para os diversos ambientes de operação da plataforma.

## 1. Variáveis de Ambiente (Backend)

O backend utiliza **Fail-Fast**: se qualquer variável obrigatória faltar ou for inválida no arranque, o processo terminará com um erro explícito.

| Variável | Obrigatória | Descrição | Exemplo (Local) |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Não | Ambiente (development, production, preview) | `development` |
| `PORT` | Não | Porta de escuta do backend | `3000` |
| `DATABASE_URL` | **Sim** | Connection string para PostgreSQL | `postgresql://...` |
| `SUPABASE_URL` | **Sim** | URL do projeto Supabase para JWKS | `https://xyz.supabase.co` |
| `OPENAI_API_KEY` | **Sim** | Chave privada da OpenAI | `sk-proj-...` |
| `CORS_ALLOWED_ORIGINS` | **Sim** | Lista de origens permitidas (comma-separated) | `http://localhost:8081` |
| `CORS_ALLOWED_ORIGIN_REGEX` | Não | Expressão regular para validação de origens | `.*\.vercel\.app$` |

## 2. Configuração (Frontend)

O frontend centraliza as suas constantes em `src/config/env.ts`.

| Variável | Contexto | Descrição |
| :--- | :--- | :--- |
| `BACKEND_URL` | Público | URL base do backend (Auto-resolvida) |
| `SUPABASE_URL` | Público | Endpoint público do Supabase |
| `SUPABASE_ANON_KEY` | Público | Chave anónima pública do Supabase |

## 3. Comportamento de CORS por Ambiente

### Local
- **Origins**: Deve incluir explicitamente o porto do Metro Bundler (ex: `http://localhost:8081`).
- **Regex**: Geralmente vazia.

### Preview / Staging
- **Origins**: URL do branch de preview.
- **Regex**: Configurável via `CORS_ALLOWED_ORIGIN_REGEX` para aceitar subdomínios da plataforma de deploy (ex: Vercel).

### Produção
- **Origins**: **Lista Estrita**. Apenas os domínios oficiais.
- **Regex**: **Desativada** (Recomendação de segurança).

## 4. Health Check vs Readiness Check

A plataforma distingue entre dois níveis de prontidão:

### Health Check (`GET /health`)
- **Objetivo**: Liveness (o processo está vivo).
- **Checks**: Apenas validadores internos.
- **Uso**: Orquestradores de contentores (ex: restart policy).

### Readiness Check (`GET /health/ready`)
- **Objetivo**: Prontidão para servir tráfego.
- **Checks**:
  - **DB**: Conectividade real (SELECT 1).
  - **Supabase**: Configuração presente.
  - **OpenAI**: Configuração presente (`config_only`).
- **Uso**: Load Balancers e Pipelines de CI/CD (antes de abrir tráfego).

## 5. Post-Deployment Checklist (Smoke Tests)

Após qualquer deploy em Staging ou Produção, deve ser executada a sequência mínima de validação:

1. **Ping Health**: `GET /health` deve retornar 200.
2. **Ping Ready**: `GET /health/ready` deve retornar 200. Se retornar 503, verificar logs do backend para identificar dependência em falha.
3. **Smoke Test Script**:
   ```bash
   node backend/scratch/smoke_test_m6.js --url <URL_AMBIENTE> --token <TOKEN_VALIDO>
   ```
4. **Verificação AI**: Validar que o `POST /ai-gateway/generate-insights` devolve o contrato canónico sem erros.
