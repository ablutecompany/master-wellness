-- Migração manual: add_ai_readings
-- Cria a tabela ai_readings mapeada a partir do modelo AiReadingRecord
-- NÃO EXECUTAR AUTOMATICAMENTE. Executar no ambiente (ex: Supabase) conforme o processo habitual.

CREATE TABLE IF NOT EXISTS "ai_readings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "active_member_id" TEXT,
    "analysis_session_id" TEXT,
    "source_analysis_ids" JSONB,
    "source_snapshot_hash" TEXT,
    "source_snapshot_json" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysis_date" TIMESTAMP(3),
    "language" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "contract_version" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "themes_json" JSONB NOT NULL,
    "narrative" TEXT NOT NULL,
    "recommendations_json" JSONB NOT NULL,
    "nutrient_suggestions_json" JSONB NOT NULL,
    "longitudinal_notes_json" JSONB,
    "limitations_json" JSONB,
    "safety_flags_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_readings_pkey" PRIMARY KEY ("id")
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS "idx_ai_readings_user_id" ON "ai_readings"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_readings_active_member_id" ON "ai_readings"("active_member_id");
CREATE INDEX IF NOT EXISTS "idx_ai_readings_analysis_session_id" ON "ai_readings"("analysis_session_id");
CREATE INDEX IF NOT EXISTS "idx_ai_readings_source_snapshot_hash" ON "ai_readings"("source_snapshot_hash");
CREATE INDEX IF NOT EXISTS "idx_ai_readings_generated_at" ON "ai_readings"("generated_at");

-- Combinação para lookup de cache híbrido
CREATE INDEX IF NOT EXISTS "idx_ai_readings_cache_lookup" ON "ai_readings"("analysis_session_id", "source_snapshot_hash", "prompt_version");
