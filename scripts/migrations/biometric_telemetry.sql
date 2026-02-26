-- Create the biometric_telemetry table for Phase 31
CREATE TABLE IF NOT EXISTS biometric_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    metric_type TEXT NOT NULL, -- 'hrv', 'sleep_score', 'deep_sleep_pct', 'readiness'
    value REAL NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE biometric_telemetry ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own biometric data" 
ON biometric_telemetry FOR SELECT 
USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own biometric data" 
ON biometric_telemetry FOR INSERT 
WITH CHECK ( auth.uid() = user_id );

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_biometric_telemetry_user_timestamp ON biometric_telemetry(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_biometric_telemetry_metric_type ON biometric_telemetry(metric_type);
