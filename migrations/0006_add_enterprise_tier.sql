-- Add enterprise tier to allowed tiers constraint
-- Drop the existing constraint and recreate with enterprise tier

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier;

ALTER TABLE users ADD CONSTRAINT chk_user_tier CHECK (tier IN (
    'lite', 'free', 'pro_trial', 'trial', 'starter', 'pro',
    'professional', 'business', 'enterprise'
));