-- Phase 49: Collective Consciousness (Consensus Mesh) Schema

-- Table for tracking individual node votes on insights
CREATE TABLE IF NOT EXISTS hive_consensus_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID REFERENCES collective_insights(id) ON DELETE CASCADE,
    node_id UUID REFERENCES matrix_instances(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('endorse', 'reject')),
    rationale TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(insight_id, node_id)
);

-- Update collective_insights to support verification levels
-- Note: These might already exist if migration was partially successful, but SQL is idempotent
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collective_insights' AND column_name='verification_status') THEN
        ALTER TABLE collective_insights ADD COLUMN verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified', 'universal'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collective_insights' AND column_name='consensus_score') THEN
        ALTER TABLE collective_insights ADD COLUMN consensus_score FLOAT DEFAULT 0.0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='collective_insights' AND column_name='endorsements_count') THEN
        ALTER TABLE collective_insights ADD COLUMN endorsements_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Indexes for efficient consensus tracking
CREATE INDEX IF NOT EXISTS idx_hive_consensus_insight ON hive_consensus_votes(insight_id);
CREATE INDEX IF NOT EXISTS idx_hive_consensus_node ON hive_consensus_votes(node_id);
CREATE INDEX IF NOT EXISTS idx_collective_insights_verification ON collective_insights(verification_status);

COMMENT ON TABLE hive_consensus_votes IS 'Node-level endorsements for shared insights and patterns';
