-- Migration 0003a: Data Cleanup - Fix Invalid Tier Values
-- Generated: 2025-09-18
-- Purpose: Clean up invalid tier values before applying constraints
-- This MUST run before 0004_data_integrity_constraints.sql

-- Report current tier values for debugging
DO $$
DECLARE
    rec RECORD;
    invalid_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting tier value cleanup...';

    -- Show current tier distribution
    FOR rec IN
        SELECT tier, COUNT(*) as count
        FROM users
        WHERE tier IS NOT NULL
        GROUP BY tier
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Current tier "%" has % users', rec.tier, rec.count;
    END LOOP;

    -- Count invalid tiers
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
    OR tier IS NULL;

    RAISE NOTICE 'Found % users with invalid tier values', invalid_count;
END $$;

-- Clean up invalid tier values
-- Map common invalid values to 'free' as the default tier

-- Update NULL tier values to 'free'
UPDATE users
SET tier = 'free'
WHERE tier IS NULL;

-- Update 'trial' to 'free' (common invalid value)
UPDATE users
SET tier = 'free'
WHERE tier = 'trial';

-- Update 'free_trial' to 'free' (another common invalid value)
UPDATE users
SET tier = 'free'
WHERE tier = 'free_trial';

-- Update any other invalid tier values to 'free'
UPDATE users
SET tier = 'free'
WHERE tier NOT IN ('free', 'starter', 'professional', 'business', 'enterprise', 'pay_as_you_go');

-- Report final tier distribution
DO $$
DECLARE
    rec RECORD;
    invalid_count INTEGER;
BEGIN
    RAISE NOTICE 'Tier cleanup completed. Final distribution:';

    -- Show final tier distribution
    FOR rec IN
        SELECT tier, COUNT(*) as count
        FROM users
        WHERE tier IS NOT NULL
        GROUP BY tier
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Final tier "%" has % users', rec.tier, rec.count;
    END LOOP;

    -- Verify no invalid tiers remain
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE tier NOT IN ('free', 'starter', 'professional', 'business', 'enterprise', 'pay_as_you_go')
    OR tier IS NULL;

    IF invalid_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All users now have valid tier values!';
    ELSE
        RAISE EXCEPTION 'ERROR: Still found % users with invalid tier values after cleanup', invalid_count;
    END IF;
END $$;