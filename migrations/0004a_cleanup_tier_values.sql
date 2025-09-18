-- Migration 0004a: Clean up invalid tier values before applying constraints
-- Generated: 2025-01-18
-- Purpose: Fix existing data that violates tier constraints

-- First, let's check what tier values currently exist
DO $$
BEGIN
    RAISE NOTICE 'Checking existing tier values in users table...';
END $$;

-- Update any invalid tier values to 'free'
-- Common invalid values: 'trial', 'free_trial', NULL, or any other non-standard value
UPDATE users
SET tier = 'free'
WHERE tier IS NULL
   OR tier NOT IN ('free', 'starter', 'professional', 'business', 'enterprise', 'pay_as_you_go');

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

-- Specific fix for common invalid values
UPDATE users SET tier = 'free' WHERE tier = 'trial';
UPDATE users SET tier = 'free' WHERE tier = 'free_trial';

-- Ensure no NULL values exist
UPDATE users SET tier = 'free' WHERE tier IS NULL;

-- Final verification
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE tier NOT IN ('free', 'starter', 'professional', 'business', 'enterprise', 'pay_as_you_go');

    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Still found % users with invalid tier values', invalid_count;
    ELSE
        RAISE NOTICE 'All users now have valid tier values';
    END IF;
END $$;