-- Erstellt die Tabelle für das Tracking der KI-Nutzung und Kosten
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    model_id TEXT NOT NULL,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(12, 10) NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) aktivieren
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Richtlinie: Nutzer können ihre eigene Nutzung sehen
CREATE POLICY "Users can view their own AI usage"
ON ai_usage_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Richtlinie: Service Rolle/Admin kann alles sehen
-- (Hier können wir später spezifischere Rollen hinzufügen)
CREATE POLICY "Service role can view all AI usage"
ON ai_usage_logs
FOR ALL
TO service_role
USING (true);

-- Indexe für bessere Abfrage-Performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_logs(created_at);
