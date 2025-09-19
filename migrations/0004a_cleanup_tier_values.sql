-- Migration 0004a: Clean up invalid tier values before applying constraints
-- Generated: 2025-01-18
-- Purpose: Fix existing data that violates tier constraints

-- First, let's check what tier values currently exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tier values in users table...';
END $$;

-- Update any invalid tier values to 'free'
-- Common invalid values: NULL, or any other non-standard value
UPDATE users
SET tier = 'free'
WHERE tier IS NULL
   OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

-- Log the cleanup
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count > 0 THEN
        RAISE NOTICE 'Updated % users with invalid tier values to "free"', updated_count;
    ELSE
        RAISE NOTICE 'No invalid tier values found - all users have valid tiers';
    END IF;
END $$;

-- Specific fix for common invalid values (these are now valid, but convert old naming)
UPDATE users SET tier = 'free' WHERE tier = 'free_trial';
UPDATE users SET tier = 'pro_trial' WHERE tier = 'trial' AND (subscription_status = 'trial' OR credits > 0);

-- Ensure no NULL values exist
UPDATE users SET tier = 'free' WHERE tier IS NULL;

-- Final verification
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Still found % users with invalid tier values', invalid_count;
    ELSE
        RAISE NOTICE 'All users now have valid tier values';
    END IF;
END $$;