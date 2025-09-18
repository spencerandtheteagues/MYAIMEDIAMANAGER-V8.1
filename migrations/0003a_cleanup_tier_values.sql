-- Migration 0003a: Data Cleanup - Fix Invalid Tier Values
-- Generated: 2025-09-18
-- Purpose: Clean up invalid tier values before applying constraints
-- This MUST run before 0004_data_integrity_constraints.sql

-- Clean up invalid tier values
-- Map common invalid values to 'free' as the default tier

-- Update NULL tier values to 'free'
UPDATE users
SET tier = 'free'
WHERE tier IS NULL;

-- Update any invalid tier values to valid ones
UPDATE users
SET tier = CASE
    WHEN tier = 'trial' THEN 'free'
    WHEN tier = 'free_trial' THEN 'free'
    WHEN tier = 'pro_trial' THEN 'pro_trial'
    WHEN tier = 'enterprise' THEN 'business'
    WHEN tier = 'pay_as_you_go' THEN 'starter'
    ELSE 'free'
END
WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')