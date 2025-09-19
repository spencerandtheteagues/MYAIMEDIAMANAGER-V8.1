-- Emergency tier fix - must run FIRST
-- This fixes the tier constraint violation that's blocking deployments

-- Remove any existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier;

-- Fix all invalid tier values with simple UPDATE statements
UPDATE users SET tier = 'free' WHERE tier IS NULL;
UPDATE users SET tier = 'free' WHERE tier = 'free_trial';
UPDATE users SET tier = 'free' WHERE tier = 'freetrial';
UPDATE users SET tier = 'pro_trial' WHERE tier = 'protrial';
UPDATE users SET tier = 'pro_trial' WHERE tier = 'pro-trial';
UPDATE users SET tier = 'business' WHERE tier = 'enterprise';
UPDATE users SET tier = 'business' WHERE tier = 'team';
UPDATE users SET tier = 'business' WHERE tier = 'agency';
UPDATE users SET tier = 'starter' WHERE tier = 'basic';
UPDATE users SET tier = 'starter' WHERE tier = 'pay_as_you_go';
UPDATE users SET tier = 'starter' WHERE tier = 'pay-as-you-go';
UPDATE users SET tier = 'starter' WHERE tier = 'payg';
UPDATE users SET tier = 'professional' WHERE tier = 'premium';

-- Catch-all: force any remaining invalid values to 'free'
UPDATE users SET tier = 'free' WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');