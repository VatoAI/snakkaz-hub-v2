-- Create enum for access levels
CREATE TYPE access_level AS ENUM ('none', 'read', 'write', 'admin');

-- Create access controls table
CREATE TABLE access_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL,
    access_level access_level NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_id UUID,
    resource_type TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create retention policies table
CREATE TABLE retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type TEXT UNIQUE NOT NULL,
    max_age_days INTEGER NOT NULL,
    max_size_bytes BIGINT,
    archive_after_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_access_controls_user_id ON access_controls(user_id);
CREATE INDEX idx_access_controls_resource_id ON access_controls(resource_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Create RLS policies
ALTER TABLE access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;

-- Access controls policies
CREATE POLICY "Users can view their own access controls"
    ON access_controls FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all access controls"
    ON access_controls FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM access_controls
            WHERE user_id = auth.uid()
            AND access_level = 'admin'
        )
    );

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM access_controls
            WHERE user_id = auth.uid()
            AND access_level = 'admin'
        )
    );

-- Retention policies policies
CREATE POLICY "Admins can manage retention policies"
    ON retention_policies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM access_controls
            WHERE user_id = auth.uid()
            AND access_level = 'admin'
        )
    );

-- Create functions for access control
CREATE OR REPLACE FUNCTION check_access(
    p_user_id UUID,
    p_resource_id UUID,
    p_required_level access_level
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM access_controls
        WHERE user_id = p_user_id
        AND resource_id = p_resource_id
        AND (expires_at IS NULL OR expires_at > NOW())
        AND access_level >= p_required_level
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for logging audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource_id UUID,
    p_resource_type TEXT,
    p_details JSONB,
    p_ip_address TEXT,
    p_user_agent TEXT
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_id,
        resource_type,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_action,
        p_resource_id,
        p_resource_type,
        p_details,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for data cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_data() RETURNS VOID AS $$
BEGIN
    -- Cleanup expired access controls
    DELETE FROM access_controls
    WHERE expires_at IS NOT NULL AND expires_at <= NOW();

    -- Cleanup audit logs based on retention policies
    DELETE FROM audit_logs
    WHERE created_at <= (
        NOW() - (
            SELECT max_age_days * INTERVAL '1 day'
            FROM retention_policies
            WHERE resource_type = 'audit_logs'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_access_controls_updated_at
    BEFORE UPDATE ON access_controls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at
    BEFORE UPDATE ON retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default retention policies
INSERT INTO retention_policies (resource_type, max_age_days, max_size_bytes, archive_after_days)
VALUES
    ('chat_messages', 30, 100 * 1024 * 1024, 7),
    ('media_files', 90, 1024 * 1024 * 1024, 30),
    ('user_data', 365, 10 * 1024 * 1024, 90),
    ('audit_logs', 365, NULL, NULL); 