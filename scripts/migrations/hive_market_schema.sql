-- Phase 48: Autonomous Market & Resource Hive Schema

CREATE TABLE IF NOT EXISTS hive_market_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poster_node UUID REFERENCES matrix_instances(id) ON DELETE CASCADE,
    worker_node UUID REFERENCES matrix_instances(id) ON DELETE SET NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('research', 'analysis', 'synthesis', 'optimization', 'vision_scan')),
    task_title TEXT NOT NULL,
    task_prompt TEXT NOT NULL,
    reward_points INTEGER DEFAULT 10,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'active', 'completed', 'failed', 'cancelled')),
    payload JSONB DEFAULT '{}',
    result JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes for efficient market scanning
CREATE INDEX IF NOT EXISTS idx_hive_market_status ON hive_market_tasks(status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_hive_market_worker ON hive_market_tasks(worker_node) WHERE worker_node IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hive_market_type ON hive_market_tasks(task_type);

COMMENT ON TABLE hive_market_tasks IS 'Decentralized task marketplace for the Matrix Hive nodes';
