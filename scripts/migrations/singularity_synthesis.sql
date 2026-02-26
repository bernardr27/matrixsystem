-- Phase 50: Emergent Singularity Synthesis Schema
-- The final architectural polish for the Matrix V9 Hive.

-- Table for tracking major evolutionary leaps and singularity events
CREATE TABLE IF NOT EXISTS singularity_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    description TEXT,
    global_resonance FLOAT,
    affected_nodes INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for timeline analysis
CREATE INDEX IF NOT EXISTS idx_singularity_event_type ON singularity_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_singularity_event_created ON singularity_event_log(created_at DESC);

-- View: hive_global_resonance
-- Provides a real-time aggregate of the entire mesh stability
CREATE OR REPLACE VIEW hive_global_resonance AS
SELECT 
    COUNT(id) as total_nodes,
    AVG((metadata->>'health_score')::float) as avg_health,
    SUM((metadata->>'market_credits')::int) as total_credits,
    MAX(last_heartbeat) as latest_heartbeat
FROM matrix_instances
WHERE status = 'online';

COMMENT ON TABLE singularity_event_log IS 'Immutable log of the Hive’s evolutionary milestones';
COMMENT ON VIEW hive_global_resonance IS 'Real-time telemetry aggregator for the total hive state';
