-- ============================================================
-- MATRIX SYSTEM — ULTIMATE MASTER MIGRATION (2026)
-- ============================================================
-- Target: New Supabase Project (Postgres 15+)
-- This script contains ALL schemas for Matrix:
-- 1. Core Service Bus (Ghost Bridge)
-- 2. Identity System (Profiles + Triggers)
-- 3. Reflect Engine (Sessions, Patterns, Synapses)
-- 4. Shared Intelligence (Mind Clusters, Collective Insights)
-- 5. Orchestration (Missions, Instances, Integrations)
-- 6. Telemetry & Analytics (Diagnostics, Uptime, System Events)
-- ============================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES — Unified Identity
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    tier TEXT DEFAULT 'free',
    reflection_points INTEGER DEFAULT 0,
    
    -- Aesthetic Preferences
    voice_enabled BOOLEAN DEFAULT FALSE,
    ambient_enabled BOOLEAN DEFAULT FALSE,
    canvas_enabled BOOLEAN DEFAULT FALSE,
    companion_enabled BOOLEAN DEFAULT FALSE,
    
    -- Reflect Specifics
    default_mode TEXT CHECK (default_mode IN ('mindset','career','money','relationships','discipline')) DEFAULT 'mindset',
    daily_prompt BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
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


-- 2. GHOST BRIDGE — Command Bus
CREATE TABLE IF NOT EXISTS ghost_bridge (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    command TEXT NOT NULL,
    source TEXT DEFAULT 'unknown',
    status TEXT DEFAULT 'pending',
    output TEXT,
    response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime for ghost_bridge
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE ghost_bridge;
COMMIT;


-- 3. REFLECT ENGINE — Cognitive Storage
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    ai_response TEXT,
    emotion TEXT,
    mood_score REAL,
    mode TEXT CHECK (mode IN ('mindset', 'career', 'money', 'relationships', 'discipline')),
    
    -- Legacy Reflect Compatibility
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

-- Session Vector Memory
CREATE TABLE IF NOT EXISTS public.session_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  embedding vector(1536), -- Standard embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.session_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own embeddings" ON public.session_embeddings FOR SELECT USING (auth.uid() = user_id);


-- 4. SHARED ARCHITECTURE
CREATE TABLE IF NOT EXISTS synapses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    target_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    strength REAL DEFAULT 0.5,
    type TEXT DEFAULT 'semantic',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    description TEXT,
    frequency INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mind_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT,
    theme TEXT,
    description TEXT,
    session_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. SYSTEM REGISTRY & TELEMETRY
CREATE TABLE IF NOT EXISTS matrix_instances (
    id TEXT PRIMARY KEY,
    hostname TEXT,
    ip TEXT,
    status TEXT DEFAULT 'online',
    version TEXT,
    services JSONB,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    severity TEXT DEFAULT 'info',
    metadata JSONB
);

-- Register system_events to Realtime after table is created
ALTER PUBLICATION supabase_realtime ADD TABLE system_events;

-- Helper Function for Logging
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


-- 6. MISC ORCHESTRATION
CREATE TABLE IF NOT EXISTS matrix_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE,
    type TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id TEXT NOT NULL,
  completed_days INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own progress" ON public.course_progress FOR ALL USING (auth.uid() = user_id);


-- ============================================================
-- DONE! Matrix V2 Ecosystem Initialized.
-- ============================================================
SELECT 'Matrix Ultimate Master Migration Complete!' AS status;
