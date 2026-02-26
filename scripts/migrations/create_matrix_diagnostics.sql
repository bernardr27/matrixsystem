-- Matrix Diagnostics Table for cross-app analytics
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS matrix_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    app TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT DEFAULT 'info',
    action TEXT NOT NULL,
    duration INTEGER,
    metadata JSONB,
    session_id TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_matrix_diagnostics_app ON matrix_diagnostics(app);
CREATE INDEX IF NOT EXISTS idx_matrix_diagnostics_timestamp ON matrix_diagnostics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_matrix_diagnostics_category ON matrix_diagnostics(category);
CREATE INDEX IF NOT EXISTS idx_matrix_diagnostics_severity ON matrix_diagnostics(severity);

-- Enable RLS
ALTER TABLE matrix_diagnostics ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon (adjust for production)
CREATE POLICY "Allow all for anon" ON matrix_diagnostics
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Auto-cleanup old entries (keep 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_diagnostics()
RETURNS void AS $$
BEGIN
    DELETE FROM matrix_diagnostics WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run this in pg_cron if available)
-- SELECT cron.schedule('cleanup-diagnostics', '0 3 * * *', 'SELECT cleanup_old_diagnostics()');
