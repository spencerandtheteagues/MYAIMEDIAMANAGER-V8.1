-- Migration 0001: Force Tier Cleanup - Critical Data Fix
-- Generated: 2025-09-19
-- Purpose: Emergency cleanup of all tier values before constraint application
-- This MUST run FIRST before any constraints are applied

-- Step 1: Show current tier distribution
DO $$
DECLARE
    tier_counts RECORD;
BEGIN
    RAISE NOTICE 'Current tier distribution:';
    FOR tier_counts IN
        SELECT tier, COUNT(*) as count
        FROM users
        GROUP BY tier
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: % users', COALESCE(tier_counts.tier, 'NULL'), tier_counts.count;
    END LOOP;
END $$;

-- Step 2: Force update ALL invalid tier values to 'free'
UPDATE users
SET tier = 'free'
WHERE tier IS NULL;

UPDATE users
SET tier = 'free'
WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

-- Step 3: Handle special tier transitions
UPDATE users
SET tier = 'free'
WHERE tier = 'free_trial';

UPDATE users
SET tier = 'pro_trial'
WHERE tier = 'trial' AND (subscription_status = 'trial' OR credits > 0);

UPDATE users
SET tier = 'free'
WHERE tier = 'trial' AND NOT (subscription_status = 'trial' OR credits > 0);

-- Step 4: Final verification and reporting
DO $$
DECLARE
    invalid_count INTEGER;
    total_users INTEGER;
    tier_summary RECORD;
BEGIN
    -- Count invalid tiers
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

    SELECT COUNT(*) INTO total_users FROM users;

    RAISE NOTICE 'Cleanup Results:';
    RAISE NOTICE '  Total users: %', total_users;
    RAISE NOTICE '  Invalid tiers remaining: %', invalid_count;

    -- Show final distribution
    RAISE NOTICE 'Final tier distribution:';
    FOR tier_summary IN
        SELECT tier, COUNT(*) as count
        FROM users
        GROUP BY tier
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  %: % users', tier_summary.tier, tier_summary.count;
    END LOOP;

    -- Fail if any invalid tiers remain
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: % users still have invalid tier values!', invalid_count;
    ELSE
        RAISE NOTICE 'SUCCESS: All users now have valid tier values';
    END IF;
END $$;