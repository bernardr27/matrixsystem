-- ============================================================
-- MATRIX SYSTEM — ULTIMATE MASTER MIGRATION V3 (2026)
-- ============================================================
-- Purpose: Complete database initialization for Matrix Ecosystem.
-- This script is DESTRUCTIVE: It drops existing tables to ensure a clean state.
-- Target: Supabase / Postgres 15+
-- ============================================================

-- 0. CLEANUP (Optional: Remove if you want to keep existing data)
DROP TABLE IF EXISTS public.integration_events CASCADE;
DROP TABLE IF EXISTS public.integration_configs CASCADE;
DROP TABLE IF EXISTS public.collective_insights CASCADE;
DROP TABLE IF EXISTS public.matrix_instances CASCADE;
DROP TABLE IF EXISTS public.session_clusters CASCADE;
DROP TABLE IF EXISTS public.mind_clusters CASCADE;
DROP TABLE IF EXISTS public.patterns CASCADE;
DROP TABLE IF EXISTS public.synapses CASCADE;
DROP TABLE IF EXISTS public.session_embeddings CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.course_progress CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.ghost_bridge CASCADE;
DROP TABLE IF EXISTS public.ghost_sessions CASCADE;
DROP TABLE IF EXISTS public.sage_memory CASCADE;
DROP TABLE IF EXISTS public.matrix_diagnostics CASCADE;
DROP TABLE IF EXISTS public.matrix_missions CASCADE;
DROP TABLE IF EXISTS public.sentinel_logs CASCADE;
DROP TABLE IF EXISTS public.system_metrics CASCADE;
DROP TABLE IF EXISTS public.uptime_log CASCADE;
DROP TABLE IF EXISTS public.system_events CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. IDENTITY SYSTEM (Profiles)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    tier TEXT DEFAULT 'free',
    reflection_points INTEGER DEFAULT 0,
    voice_enabled BOOLEAN DEFAULT FALSE,
    ambient_enabled BOOLEAN DEFAULT FALSE,
    canvas_enabled BOOLEAN DEFAULT FALSE,
    companion_enabled BOOLEAN DEFAULT FALSE,
    default_mode TEXT CHECK (default_mode IN ('mindset','career','money','relationships','discipline')) DEFAULT 'mindset',
    daily_prompt BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger: Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. COMMUNICATION BUS (Ghost Bridge)
CREATE TABLE public.ghost_bridge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    source TEXT DEFAULT 'unknown',
    status TEXT DEFAULT 'pending',
    output TEXT,
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ghost_bridge_status ON ghost_bridge(status);

-- 4. COGNITIVE ENGINE (Sage Memory & Sessions)
CREATE TABLE public.sage_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    memory_type TEXT NOT NULL, -- 'conversation', 'fact', 'procedure', 'observation'
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    importance_score REAL DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ghost_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    context JSONB DEFAULT '{}',
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 5. REFLECT ENGINE (Public User Storage)
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    ai_response TEXT,
    emotion TEXT,
    mood_score REAL,
    mode TEXT CHECK (mode IN ('mindset', 'career', 'money', 'relationships', 'discipline')),
    initial_input TEXT,
    mirror_text TEXT,
    pattern_text TEXT,
    reframe_question TEXT,
    user_resolution TEXT,
    is_trashed BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.session_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ANALYTICS & PATTERNS
CREATE TABLE public.synapses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    target_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    strength REAL DEFAULT 0.5,
    type TEXT DEFAULT 'semantic',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    description TEXT,
    frequency INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.mind_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_name TEXT UNIQUE NOT NULL,
    description TEXT,
    theme TEXT,
    session_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISTRIBUTED REGISTRY (Nexus Support)
CREATE TABLE public.matrix_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name TEXT UNIQUE NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('dev', 'staging', 'production', 'test')),
    host TEXT NOT NULL,
    ip TEXT,
    version TEXT,
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'degraded', 'maintenance')),
    services JSONB,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    cpu_load FLOAT,
    ram_percent FLOAT,
    uptime_seconds BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collective_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_instance UUID REFERENCES matrix_instances(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('optimization', 'pattern', 'anomaly', 'prediction')),
    title TEXT NOT NULL,
    content TEXT,
    description TEXT,
    solution TEXT,
    effectiveness_score FLOAT DEFAULT 0.5 CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 1.0),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INTEGRATIONS (The Arsenal)
CREATE TABLE public.integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT UNIQUE NOT NULL,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('notification', 'cloud', 'devops', 'webhook', 'custom')),
    display_name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    credentials JSONB DEFAULT '{}',
    config JSONB DEFAULT '{}',
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'failed', 'unknown')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT REFERENCES integration_configs(integration_name) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'retrying')),
    payload JSONB,
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SERVICE TELEMETRY
CREATE TABLE public.system_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    severity TEXT DEFAULT 'info',
    metadata JSONB
);

CREATE TABLE public.system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL, -- 'cpu', 'ram', 'disk', 'network'
    value REAL NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.uptime_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cpu_load REAL,
    ram_usage INTEGER,
    services JSONB,
    all_healthy BOOLEAN DEFAULT TRUE
);

-- 10. REALTIME CONFIGURATION
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE ghost_bridge, system_events, matrix_instances;
COMMIT;

-- 11. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION log_system_event(
    p_source TEXT,
    p_event_type TEXT,
    p_message TEXT,
    p_severity TEXT DEFAULT 'info',
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO system_events (source, event_type, message, severity, metadata)
    VALUES (p_source, p_event_type, p_message, p_severity, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. INITIALIZATION
INSERT INTO ghost_sessions (session_id, context) VALUES ('system-init', '{"source": "V3-Migration"}');
INSERT INTO integration_configs (integration_name, integration_type, display_name, enabled) VALUES 
('slack', 'notification', 'Slack', false),
('discord', 'notification', 'Discord', false);

-- ============================================================
-- DONE! Matrix V3 Ecosystem Fully Manifested.
-- ============================================================
SELECT 'Matrix Ultimate Master Migration V3 Complete!' AS status;
