-- Migration 0005: Security and Audit Tables
-- Generated: 2025-01-17
-- Purpose: Add security audit trails and sensitive operation logging

-- Create audit log table for tracking all sensitive operations
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'success', -- success, failed, error
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for password history (prevent reuse)
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for login attempts (brute force protection)
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username_or_email VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for API rate limiting
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour'
);

-- Create table for storing encrypted sensitive data
CREATE TABLE IF NOT EXISTS encrypted_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL, -- api_key, oauth_token, etc.
    encrypted_value TEXT NOT NULL,
    encryption_key_version INTEGER DEFAULT 1,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit and security tables
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

CREATE INDEX idx_password_history_user ON password_history(user_id, created_at DESC);

CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address, created_at DESC);
CREATE INDEX idx_login_attempts_username ON login_attempts(username_or_email) WHERE username_or_email IS NOT NULL;
CREATE INDEX idx_login_attempts_window ON login_attempts(created_at) WHERE created_at > NOW() - INTERVAL '1 hour';

CREATE INDEX idx_api_rate_limits_user ON api_rate_limits(user_id, endpoint, window_end);
CREATE INDEX idx_api_rate_limits_window ON api_rate_limits(window_end) WHERE window_end > NOW();

CREATE INDEX idx_encrypted_data_user ON encrypted_data(user_id, data_type);
CREATE INDEX idx_encrypted_data_expiry ON encrypted_data(expires_at) WHERE expires_at IS NOT NULL;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id VARCHAR,
    p_old_values JSONB,
    p_new_values JSONB,
    p_ip_address VARCHAR,
    p_user_agent TEXT,
    p_session_id VARCHAR
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent, session_id
    ) VALUES (
        p_user_id, p_action, p_entity_type, p_entity_id,
        p_old_values, p_new_values, p_ip_address, p_user_agent, p_session_id
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check login attempts (rate limiting)
CREATE OR REPLACE FUNCTION check_login_attempts(
    p_identifier VARCHAR,
    p_ip_address VARCHAR,
    p_max_attempts INTEGER DEFAULT 5,
    p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
    v_attempt_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_attempt_count
    FROM login_attempts
    WHERE (username_or_email = p_identifier OR ip_address = p_ip_address)
        AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL
        AND success = FALSE;

    RETURN v_attempt_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- Function to check API rate limits
CREATE OR REPLACE FUNCTION check_api_rate_limit(
    p_user_id UUID,
    p_endpoint VARCHAR,
    p_method VARCHAR,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
    v_request_count INTEGER;
BEGIN
    SELECT COALESCE(SUM(count), 0) INTO v_request_count
    FROM api_rate_limits
    WHERE user_id = p_user_id
        AND endpoint = p_endpoint
        AND method = p_method
        AND window_end > NOW();

    IF v_request_count < p_max_requests THEN
        -- Update or insert rate limit record
        INSERT INTO api_rate_limits (user_id, endpoint, method, count, window_end)
        VALUES (p_user_id, p_endpoint, p_method, 1, NOW() + (p_window_minutes || ' minutes')::INTERVAL)
        ON CONFLICT (user_id, endpoint, method, window_end)
        DO UPDATE SET count = api_rate_limits.count + 1;

        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to audit user changes
CREATE OR REPLACE FUNCTION audit_user_changes() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Check if sensitive fields changed
        IF OLD.email IS DISTINCT FROM NEW.email OR
           OLD.role IS DISTINCT FROM NEW.role OR
           OLD.is_admin IS DISTINCT FROM NEW.is_admin OR
           OLD.account_status IS DISTINCT FROM NEW.account_status OR
           OLD.tier IS DISTINCT FROM NEW.tier OR
           OLD.credits IS DISTINCT FROM NEW.credits THEN

            INSERT INTO audit_logs (
                user_id, action, entity_type, entity_id,
                old_values, new_values
            ) VALUES (
                NEW.id, 'UPDATE_USER', 'user', NEW.id::VARCHAR,
                jsonb_build_object(
                    'email', OLD.email,
                    'role', OLD.role,
                    'is_admin', OLD.is_admin,
                    'account_status', OLD.account_status,
                    'tier', OLD.tier,
                    'credits', OLD.credits
                ),
                jsonb_build_object(
                    'email', NEW.email,
                    'role', NEW.role,
                    'is_admin', NEW.is_admin,
                    'account_status', NEW.account_status,
                    'tier', NEW.tier,
                    'credits', NEW.credits
                )
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            user_id, action, entity_type, entity_id,
            old_values
        ) VALUES (
            OLD.id, 'DELETE_USER', 'user', OLD.id::VARCHAR,
            to_jsonb(OLD)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_user_changes_trigger
    AFTER UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_user_changes();

-- Trigger to audit credit transactions
CREATE OR REPLACE FUNCTION audit_credit_transactions() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, action, entity_type, entity_id,
        new_values
    ) VALUES (
        NEW.user_id, 'CREDIT_TRANSACTION', 'credit_transaction', NEW.id::VARCHAR,
        jsonb_build_object(
            'amount', NEW.amount,
            'type', NEW.type,
            'description', NEW.description,
            'stripe_payment_intent_id', NEW.stripe_payment_intent_id
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_credit_transactions_trigger
    AFTER INSERT ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_credit_transactions();

-- Create materialized view for user statistics (for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
SELECT
    u.id,
    u.username,
    u.email,
    u.tier,
    u.credits,
    COUNT(DISTINCT c.id) as total_campaigns,
    COUNT(DISTINCT p.id) as total_posts,
    COUNT(DISTINCT cl.id) as total_media,
    COALESCE(SUM(ct.amount), 0) as total_credits_purchased,
    MAX(u.last_activity_at) as last_activity
FROM users u
LEFT JOIN campaigns c ON c.user_id = u.id
LEFT JOIN posts p ON p.user_id = u.id
LEFT JOIN content_library cl ON cl.user_id = u.id
LEFT JOIN credit_transactions ct ON ct.user_id = u.id AND ct.type = 'purchase'
GROUP BY u.id, u.username, u.email, u.tier, u.credits;

CREATE INDEX idx_user_statistics_id ON user_statistics(id);
CREATE INDEX idx_user_statistics_tier ON user_statistics(tier);

-- Function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_user_statistics() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_statistics;
END;
$$ LANGUAGE plpgsql;