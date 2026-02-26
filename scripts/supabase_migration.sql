-- ============================================================
-- MATRIX SYSTEM — Master Supabase Migration Script
-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL → New Query)
-- This script is IDEMPOTENT (safe to run multiple times)
-- ============================================================

-- ============================================================
-- 1. GHOST BRIDGE — Central command/event bus
-- ============================================================
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

CREATE INDEX IF NOT EXISTS idx_ghost_bridge_status ON ghost_bridge(status);
CREATE INDEX IF NOT EXISTS idx_ghost_bridge_created_at ON ghost_bridge(created_at DESC);

-- Enable Realtime for ghost_bridge (required for live updates)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'ghost_bridge') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE ghost_bridge;
  END IF;
END $$;

-- ============================================================
-- 2. PROFILES — User identity and preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    display_name TEXT,
    tier TEXT DEFAULT 'free',
    voice_enabled BOOLEAN DEFAULT FALSE,
    ambient_enabled BOOLEAN DEFAULT FALSE,
    canvas_enabled BOOLEAN DEFAULT FALSE,
    companion_enabled BOOLEAN DEFAULT FALSE,
    reflection_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. SESSIONS — Reflect journal entries
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    ai_response TEXT,
    emotion TEXT,
    mood_score REAL,
    themes TEXT[],
    keywords TEXT[],
    is_trashed BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    capsule_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- ============================================================
-- 4. SYNAPSES — Connection links between sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS synapses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    target_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    strength REAL DEFAULT 0.5,
    type TEXT DEFAULT 'semantic',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PATTERNS — Detected behavioral/emotional patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    description TEXT,
    frequency INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. MIND CLUSTERS — Theme clustering from Synchronicity Engine
-- ============================================================
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

CREATE TABLE IF NOT EXISTS session_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    cluster_id UUID REFERENCES mind_clusters(id) ON DELETE CASCADE,
    relevance REAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. MATRIX DIAGNOSTICS — Cross-app diagnostic logging
-- ============================================================
CREATE TABLE IF NOT EXISTS matrix_diagnostics (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    app TEXT,
    category TEXT,
    severity TEXT DEFAULT 'info',
    action TEXT,
    duration INTEGER,
    metadata JSONB,
    session_id TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_app ON matrix_diagnostics(app);
CREATE INDEX IF NOT EXISTS idx_diagnostics_timestamp ON matrix_diagnostics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_diagnostics_severity ON matrix_diagnostics(severity);

-- ============================================================
-- 8. MATRIX MISSIONS — Mission control tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS matrix_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    type TEXT DEFAULT 'task',
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 9. MATRIX INSTANCES — Distributed consciousness registry
-- ============================================================
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

-- ============================================================
-- 10. COLLECTIVE INSIGHTS — Cross-instance AI insights
-- ============================================================
CREATE TABLE IF NOT EXISTS collective_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT,
    type TEXT,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. INTEGRATION CONFIGS — Service integration settings
-- ============================================================
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE,
    type TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT,
    event_type TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. SENTINEL LOGS — File watcher event log
-- ============================================================
CREATE TABLE IF NOT EXISTS sentinel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT,
    file_path TEXT,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. SAGE MEMORY — Persistent AI chat history (Phase 11)
-- ============================================================
CREATE TABLE IF NOT EXISTS sage_memory (
    id TEXT PRIMARY KEY DEFAULT 'sage_default',
    history JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. UPTIME LOG — Service health snapshots (Phase 14)
-- ============================================================
CREATE TABLE IF NOT EXISTS uptime_log (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cpu_load REAL,
    ram_usage INTEGER,
    ram_total_gb REAL,
    uptime_hours REAL,
    services JSONB,
    all_healthy BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_uptime_log_timestamp ON uptime_log(timestamp DESC);

-- ============================================================
-- 15. SYSTEM EVENT LOG — Real-time event stream (Phase 17)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_events (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    severity TEXT DEFAULT 'info',
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_source ON system_events(source);

-- Enable Realtime for system_events
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'system_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE system_events;
  END IF;
END $$;

-- ============================================================
-- 16. HELPER FUNCTIONS — Stored Procedures
-- ============================================================

-- Fast logging RPC for high-volume events
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

-- ============================================================
-- DONE! All Matrix tables are now ready.
-- ============================================================
SELECT 'Matrix Supabase Migration Complete!' AS status,
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS total_tables;
