-- Phase 34: The Arsenal - Integration Ecosystem Schema

-- Table: integration_configs
-- Stores configuration and credentials for external integrations
CREATE TABLE IF NOT EXISTS integration_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT UNIQUE NOT NULL,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('notification', 'cloud', 'devops', 'webhook', 'custom')),
    display_name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    credentials JSONB DEFAULT '{}', -- Store encrypted credentials
    config JSONB DEFAULT '{}', -- Integration-specific configuration
    rate_limit INTEGER DEFAULT 60, -- Requests per minute
    health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'failed', 'unknown')),
    last_success TIMESTAMPTZ,
    last_failure TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: integration_events
-- Audit log of all integration activities
CREATE TABLE IF NOT EXISTS integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_name TEXT REFERENCES integration_configs(integration_name) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'notification', 'api_call', 'webhook', 'error'
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'retrying')),
    payload JSONB,
    response JSONB,
    error TEXT,
    duration_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_integration_configs_type ON integration_configs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integration_configs_enabled ON integration_configs(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_integration_events_name ON integration_events(integration_name);
CREATE INDEX IF NOT EXISTS idx_integration_events_status ON integration_events(status);
CREATE INDEX IF NOT EXISTS idx_integration_events_created ON integration_events(created_at DESC);

-- Function to update health status based on recent events
CREATE OR REPLACE FUNCTION update_integration_health()
RETURNS TRIGGER AS $$
BEGIN
    -- Update success/failure counts
    IF NEW.status = 'success' THEN
        UPDATE integration_configs 
        SET 
            success_count = success_count + 1,
            last_success = NEW.created_at,
            failure_count = 0,
            health_status = 'healthy',
            updated_at = now()
        WHERE integration_name = NEW.integration_name;
    ELSIF NEW.status = 'failed' THEN
        UPDATE integration_configs 
        SET 
            failure_count = failure_count + 1,
            last_failure = NEW.created_at,
            health_status = CASE 
                WHEN failure_count + 1 >= 5 THEN 'failed'
                WHEN failure_count + 1 >= 2 THEN 'degraded'
                ELSE 'healthy'
            END,
            updated_at = now()
        WHERE integration_name = NEW.integration_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update health on new events
CREATE TRIGGER trigger_update_integration_health
    AFTER INSERT ON integration_events
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_health();

-- Seed data: Pre-configured integrations (disabled by default)
INSERT INTO integration_configs (integration_name, integration_type, display_name, description, enabled) VALUES
    ('slack', 'notification', 'Slack', 'Send notifications to Slack channels via webhooks', false),
    ('discord', 'notification', 'Discord', 'Send notifications to Discord channels via webhooks', false),
    ('email', 'notification', 'Email (SMTP)', 'Send email notifications via SMTP', false),
    ('github', 'devops', 'GitHub', 'Create issues, update status, and track repository activity', false),
    ('webhook', 'webhook', 'Custom Webhook', 'Send custom webhooks to any endpoint', false)
ON CONFLICT (integration_name) DO NOTHING;

COMMENT ON TABLE integration_configs IS 'Configuration and credentials for external service integrations';
COMMENT ON TABLE integration_events IS 'Audit log of all integration events and API calls';
