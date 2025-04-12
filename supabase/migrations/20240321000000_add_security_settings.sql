-- Create security settings table
CREATE TABLE security_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security reports table
CREATE TABLE security_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_controls JSONB,
    audit_logs JSONB,
    retention_policies JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_security_settings_key ON security_settings(key);
CREATE INDEX idx_security_reports_created_at ON security_reports(created_at);

-- Enable RLS
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage security settings"
    ON security_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM access_controls
            WHERE user_id = auth.uid()
            AND access_level = 'admin'
        )
    );

CREATE POLICY "Admins can view security reports"
    ON security_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM access_controls
            WHERE user_id = auth.uid()
            AND access_level = 'admin'
        )
    );

-- Create function to update security report
CREATE OR REPLACE FUNCTION update_security_report()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_reports (
        access_controls,
        audit_logs,
        retention_policies
    ) VALUES (
        (
            SELECT jsonb_build_object(
                'totalUsers', COUNT(DISTINCT user_id),
                'totalGrants', COUNT(*)
            )
            FROM access_controls
        ),
        (
            SELECT jsonb_build_object(
                'totalEntries', COUNT(*),
                'recentActions', (
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'action', action,
                            'timestamp', created_at,
                            'user_id', user_id
                        )
                    )
                    FROM audit_logs
                    ORDER BY created_at DESC
                    LIMIT 10
                )
            )
            FROM audit_logs
        ),
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'resource_type', resource_type,
                    'max_age_days', max_age_days,
                    'max_size_bytes', max_size_bytes,
                    'archive_after_days', archive_after_days
                )
            )
            FROM retention_policies
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for security report updates
CREATE TRIGGER update_security_report_trigger
    AFTER INSERT OR UPDATE OR DELETE ON access_controls
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_security_report();

CREATE TRIGGER update_security_report_trigger
    AFTER INSERT OR UPDATE OR DELETE ON audit_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_security_report();

CREATE TRIGGER update_security_report_trigger
    AFTER INSERT OR UPDATE OR DELETE ON retention_policies
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_security_report();

-- Insert default security settings
INSERT INTO security_settings (key, value) VALUES
    ('NEXT_PUBLIC_ANALYTICS_ENABLED', 'false'),
    ('NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED', 'false'),
    ('NEXT_PUBLIC_SERVICE_WORKER_ENABLED', 'true'),
    ('NEXT_PUBLIC_AUDIT_LOG_ENABLED', 'true'),
    ('NEXT_PUBLIC_RETENTION_POLICY_ENABLED', 'true'); 