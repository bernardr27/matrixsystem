-- Phase 44: Hive Messaging Schema
-- Matrix Hive Communication Layer

CREATE TABLE IF NOT EXISTS hive_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node UUID REFERENCES matrix_instances(id) ON DELETE CASCADE,
    target_node UUID REFERENCES matrix_instances(id) ON DELETE CASCADE, -- NULL for broadcast
    type TEXT NOT NULL, -- RESEARCH_DELEGATION, HEARTBEAT_SYNC, DIRECT_MESSAGE, CONSENSUS_VOTE
    payload JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    created_at TIMESTAMPTZ DEFAULT now(),
    processed_at TIMESTAMPTZ
);

-- Index for efficient message retrieval
CREATE INDEX IF NOT EXISTS idx_hive_messages_target_status ON hive_messages(target_node, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_hive_messages_type ON hive_messages(type);
CREATE INDEX IF NOT EXISTS idx_hive_messages_created ON hive_messages(created_at DESC);

-- Enable Realtime for hive_messages
-- Note: This requires the 'realtime' publication to exist
-- ALTER PUBLICATION supabase_realtime ADD TABLE hive_messages;

COMMENT ON TABLE hive_messages IS 'Peer-to-peer messaging and coordination channel for the Matrix Hive';
