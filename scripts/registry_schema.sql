-- Phase 33: Distributed Consciousness Schema
-- Matrix Registry Tables

-- Table: matrix_instances
-- Stores metadata about each Matrix instance across environments
CREATE TABLE IF NOT EXISTS matrix_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name TEXT UNIQUE NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('dev', 'staging', 'production', 'test')),
    host TEXT NOT NULL,
    version TEXT,
    status TEXT DEFAULT 'online' CHECK (status IN ('online', 'offline', 'degraded', 'maintenance')),
    last_heartbeat TIMESTAMPTZ DEFAULT now(),
    cpu_load FLOAT,
    ram_percent FLOAT,
    uptime_seconds BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for quick status lookups
CREATE INDEX IF NOT EXISTS idx_matrix_instances_status ON matrix_instances(status);
CREATE INDEX IF NOT EXISTS idx_matrix_instances_environment ON matrix_instances(environment);
CREATE INDEX IF NOT EXISTS idx_matrix_instances_heartbeat ON matrix_instances(last_heartbeat DESC);

-- Table: collective_insights
-- Stores optimization strategies and patterns shared across instances
CREATE TABLE IF NOT EXISTS collective_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_instance UUID REFERENCES matrix_instances(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('optimization', 'pattern', 'anomaly', 'prediction')),
    title TEXT NOT NULL,
    description TEXT,
    solution TEXT,
    effectiveness_score FLOAT DEFAULT 0.5 CHECK (effectiveness_score >= 0.0 AND effectiveness_score <= 1.0),
    applicable_to JSONB DEFAULT '["dev", "staging", "production"]',
    metadata JSONB DEFAULT '{}',
    times_applied INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_collective_insights_type ON collective_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_collective_insights_effectiveness ON collective_insights(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_collective_insights_created ON collective_insights(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_matrix_instances_updated_at
    BEFORE UPDATE ON matrix_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collective_insights_updated_at
    BEFORE UPDATE ON collective_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional - comment out in production)
-- INSERT INTO matrix_instances (instance_name, environment, host, version) VALUES
-- ('local-dev', 'dev', 'localhost', '2.0.0'),
-- ('staging-01', 'staging', 'stage.example.com', '2.0.0'),
-- ('prod-main', 'production', 'matrix.example.com', '1.9.5');

COMMENT ON TABLE matrix_instances IS 'Registry of all Matrix instances across environments';
COMMENT ON TABLE collective_insights IS 'Shared knowledge base of optimizations and patterns across the Matrix hive';
