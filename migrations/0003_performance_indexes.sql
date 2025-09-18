-- Migration 0003: Performance and Security Indexes
-- Generated: 2025-01-17
-- Purpose: Add critical indexes for query performance and data integrity

-- User Management Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_trial_ends_at ON users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_activity ON users(last_activity_at) WHERE last_activity_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Campaign Management Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date) WHERE start_date IS NOT NULL;

-- Post Management Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_campaign_id ON posts(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_user_status ON posts(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_campaign_schedule ON posts(campaign_id, scheduled_for) WHERE campaign_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_ref ON posts(content_ref) WHERE content_ref IS NOT NULL;

-- Credit System Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_user_date ON credit_transactions(user_id, created_at DESC);

-- Notification System Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_popup ON notifications(user_id, requires_popup, delivered_at) WHERE requires_popup = true;

-- Content Library Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_library_user_id ON content_library(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_library_type ON content_library(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_library_platform ON content_library(platform) WHERE platform IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_library_tags ON content_library USING GIN(tags) WHERE tags IS NOT NULL;

-- Analytics Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_date ON analytics(date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_user_date ON analytics(user_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_platform_metric ON analytics(platform, metric);

-- Platform Connection Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platforms_user_id ON platforms(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_platforms_connected ON platforms(user_id, is_connected) WHERE is_connected = true;

-- Brand Profile Index (already unique, but add for completeness)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brand_profiles_user_id ON brand_profiles(user_id);

-- Content Feedback Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_feedback_user_id ON content_feedback(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_feedback_content ON content_feedback(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_feedback_quality ON content_feedback(quality_score) WHERE quality_score IS NOT NULL;

-- Referral System Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Admin Action Audit Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_user_id) WHERE admin_user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_actions_date ON admin_actions(created_at DESC);

-- Full-text search index for content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_content_search ON posts USING GIN(to_tsvector('english', content));

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_users ON users(id) WHERE account_status = 'active' AND deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trial_users ON users(id, trial_ends_at) WHERE subscription_status = 'trial';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_posts ON posts(user_id, scheduled_for) WHERE status = 'scheduled';

-- Update statistics for query planner
ANALYZE users;
ANALYZE campaigns;
ANALYZE posts;
ANALYZE credit_transactions;
ANALYZE content_library;
ANALYZE notifications;