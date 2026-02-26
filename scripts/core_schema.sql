-- Complete Matrix Database Schema
-- Ensures all required tables exist for 100% operational status

-- Core Communication Table
CREATE TABLE IF NOT EXISTS ghost_bridge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    command TEXT NOT NULL,
    output TEXT,
    source TEXT DEFAULT 'user',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Sage Memory System
CREATE TABLE IF NOT EXISTS sage_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    memory_type TEXT NOT NULL, -- 'conversation', 'fact', 'procedure', 'observation'
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- For semantic search (if using pgvector)
    metadata JSONB DEFAULT '{}',
    importance_score REAL DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_accessed TIMESTAMPTZ DEFAULT now()
);

-- Mind Clusters (Concept Grouping)
CREATE TABLE IF NOT EXISTS mind_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_name TEXT UNIQUE NOT NULL,
    description TEXT,
    concept_keywords TEXT[],
    memory_ids UUID[],
    strength REAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ghost Sessions (Conversation Tracking)
CREATE TABLE IF NOT EXISTS ghost_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    context JSONB DEFAULT '{}',
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT now(),
    last_activity TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- System Metrics (for Predictive Cortex)
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL, -- 'cpu', 'ram', 'disk', 'network'
    value REAL NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ghost_bridge_status ON ghost_bridge(status);
CREATE INDEX IF NOT EXISTS idx_ghost_bridge_created ON ghost_bridge(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sage_memory_session ON sage_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_sage_memory_type ON sage_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_sage_memory_created ON sage_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ghost_sessions_session_id ON ghost_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ghost_sessions_activity ON ghost_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_system_metrics_created ON system_metrics(created_at DESC);

-- Comments
COMMENT ON TABLE ghost_bridge IS 'Core command/response bridge between components';
COMMENT ON TABLE sage_memory IS 'Long-term memory storage for Sage AI';
COMMENT ON TABLE mind_clusters IS 'Conceptual groupings of related memories';
COMMENT ON TABLE ghost_sessions IS 'Conversation session tracking';
COMMENT ON TABLE system_metrics IS 'Time-series system performance metrics';

-- Seed Data for Ghost Sessions (if empty)
INSERT INTO ghost_sessions (session_id, context, message_count)
VALUES ('system-init', '{"source": "bootstrap", "purpose": "system initialization"}', 0)
ON CONFLICT (session_id) DO NOTHING;
