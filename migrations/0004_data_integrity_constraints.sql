-- Migration 0004: Data Integrity and Business Rule Constraints
-- Generated: 2025-01-17
-- Purpose: Add constraints to enforce business rules and data integrity

-- Check Constraints for Valid Enums
ALTER TABLE users ADD CONSTRAINT chk_user_role CHECK (role IN ('admin', 'user'));
ALTER TABLE users ADD CONSTRAINT chk_user_tier CHECK (tier IN ('free', 'starter', 'professional', 'business', 'enterprise', 'pay_as_you_go'));
ALTER TABLE users ADD CONSTRAINT chk_account_status CHECK (account_status IN ('active', 'frozen', 'suspended', 'deleted'));
ALTER TABLE users ADD CONSTRAINT chk_subscription_status CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired', 'paused'));
ALTER TABLE users ADD CONSTRAINT chk_trial_variant CHECK (trial_variant IN ('nocard7', 'card14'));
ALTER TABLE users ADD CONSTRAINT chk_credits_positive CHECK (credits >= 0);
ALTER TABLE users ADD CONSTRAINT chk_trial_images CHECK (trial_images_remaining >= 0);
ALTER TABLE users ADD CONSTRAINT chk_trial_videos CHECK (trial_videos_remaining >= 0);

-- Campaign Constraints
ALTER TABLE campaigns ADD CONSTRAINT chk_campaign_status CHECK (status IN ('draft', 'generating', 'review', 'active', 'completed', 'paused', 'cancelled'));
ALTER TABLE campaigns ADD CONSTRAINT chk_posts_per_day CHECK (posts_per_day > 0 AND posts_per_day <= 50);
ALTER TABLE campaigns ADD CONSTRAINT chk_total_posts CHECK (total_posts > 0 AND total_posts <= 1000);
ALTER TABLE campaigns ADD CONSTRAINT chk_generation_progress CHECK (generation_progress >= 0 AND generation_progress <= 100);
ALTER TABLE campaigns ADD CONSTRAINT chk_campaign_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Post Constraints
ALTER TABLE posts ADD CONSTRAINT chk_post_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'posted', 'failed'));
ALTER TABLE posts ADD CONSTRAINT chk_post_content_length CHECK (LENGTH(content) <= 10000);

-- Credit Transaction Constraints
ALTER TABLE credit_transactions ADD CONSTRAINT chk_transaction_type CHECK (type IN ('purchase', 'usage', 'refund', 'admin_adjustment', 'admin_reset', 'bonus', 'referral'));
ALTER TABLE credit_transactions ADD CONSTRAINT chk_transaction_amount CHECK (
    (type = 'usage' AND amount < 0) OR
    (type IN ('purchase', 'refund', 'bonus', 'referral') AND amount > 0) OR
    (type IN ('admin_adjustment', 'admin_reset'))
);

-- Notification Constraints
ALTER TABLE notifications ADD CONSTRAINT chk_notification_type CHECK (type IN ('system', 'admin_message', 'campaign_complete', 'post_approved', 'post_rejected', 'credit_low', 'new_feature', 'trial_ending', 'subscription_expiring'));

-- Content Library Constraints
ALTER TABLE content_library ADD CONSTRAINT chk_content_type CHECK (type IN ('image', 'video', 'gif'));
ALTER TABLE content_library ADD CONSTRAINT chk_usage_count CHECK (usage_count >= 0);

-- Analytics Constraints
ALTER TABLE analytics ADD CONSTRAINT chk_metric_type CHECK (metric IN ('engagement', 'reach', 'followers', 'clicks', 'impressions', 'conversions'));
ALTER TABLE analytics ADD CONSTRAINT chk_analytics_value CHECK (value >= 0);

-- Referral Constraints
ALTER TABLE referrals ADD CONSTRAINT chk_referral_status CHECK (status IN ('pending', 'completed', 'cancelled', 'expired'));
ALTER TABLE referrals ADD CONSTRAINT chk_credits_earned CHECK (credits_earned >= 0);

-- Admin Action Constraints
ALTER TABLE admin_actions ADD CONSTRAINT chk_admin_action CHECK (action IN ('add_credits', 'remove_credits', 'freeze_account', 'unfreeze_account', 'delete_account', 'change_tier', 'process_refund', 'send_message', 'reset_password', 'verify_email', 'extend_trial'));

-- Foreign Key Constraints with CASCADE options
ALTER TABLE platforms DROP CONSTRAINT IF EXISTS platforms_user_id_fkey;
ALTER TABLE platforms ADD CONSTRAINT platforms_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_user_id_fkey;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
ALTER TABLE posts ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_campaign_id_fkey;
ALTER TABLE posts ADD CONSTRAINT posts_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_content_ref_fkey;
ALTER TABLE posts ADD CONSTRAINT posts_content_ref_fkey
    FOREIGN KEY (content_ref) REFERENCES content_library(id) ON DELETE SET NULL;

ALTER TABLE ai_suggestions DROP CONSTRAINT IF EXISTS ai_suggestions_user_id_fkey;
ALTER TABLE ai_suggestions ADD CONSTRAINT ai_suggestions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE analytics DROP CONSTRAINT IF EXISTS analytics_user_id_fkey;
ALTER TABLE analytics ADD CONSTRAINT analytics_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;
ALTER TABLE credit_transactions ADD CONSTRAINT credit_transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE content_library DROP CONSTRAINT IF EXISTS content_library_user_id_fkey;
ALTER TABLE content_library ADD CONSTRAINT content_library_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE brand_profiles DROP CONSTRAINT IF EXISTS brand_profiles_user_id_fkey;
ALTER TABLE brand_profiles ADD CONSTRAINT brand_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE content_feedback DROP CONSTRAINT IF EXISTS content_feedback_user_id_fkey;
ALTER TABLE content_feedback ADD CONSTRAINT content_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referrer_id_fkey;
ALTER TABLE referrals ADD CONSTRAINT referrals_referrer_id_fkey
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_referred_user_id_fkey;
ALTER TABLE referrals ADD CONSTRAINT referrals_referred_user_id_fkey
    FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_admin_user_id_fkey;
ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_admin_user_id_fkey
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE admin_actions DROP CONSTRAINT IF EXISTS admin_actions_target_user_id_fkey;
ALTER TABLE admin_actions ADD CONSTRAINT admin_actions_target_user_id_fkey
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add default values where appropriate
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE campaigns ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE campaigns ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE posts ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE posts ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE content_library ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE content_library ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE brand_profiles ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE brand_profiles ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_library_updated_at BEFORE UPDATE ON content_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at BEFORE UPDATE ON brand_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();