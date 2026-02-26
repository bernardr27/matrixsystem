-- Run this in your Supabase SQL Editor to enable AI Quota tracking
CREATE TABLE IF NOT EXISTS ai_telemetry (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_name text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  cost_usd numeric,
  latency_ms int,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE ai_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for authenticated users only" ON "public"."ai_telemetry" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON "public"."ai_telemetry" AS PERMISSIVE FOR SELECT TO public USING (true);
