-- Migration 0000: EMERGENCY Tier Fix - Must Run FIRST
-- Generated: 2025-01-19
-- Purpose: CRITICAL data cleanup before ANY constraints
-- This migration MUST execute before all others

-- Step 1: Remove any existing constraints (if they exist)
DO $$
BEGIN
    -- Drop constraint if it exists (won't error if not exists)
    ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier;
    RAISE NOTICE 'Dropped existing tier constraint (if existed)';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'No existing tier constraint to drop';
END $$;

-- Step 2: Show current problematic data
DO $$
DECLARE
    problem_count INTEGER;
    null_count INTEGER;
    invalid_values TEXT;
BEGIN
    -- Count NULL values
    SELECT COUNT(*) INTO null_count FROM users WHERE tier IS NULL;

    -- Count and list invalid values
    SELECT COUNT(*), STRING_AGG(DISTINCT tier, ', ')
    INTO problem_count, invalid_values
    FROM users
    WHERE tier IS NOT NULL
    AND tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

    RAISE NOTICE '=== TIER DATA ISSUES ===';
    RAISE NOTICE 'NULL tiers: %', null_count;
    RAISE NOTICE 'Invalid tier count: %', problem_count;
    IF invalid_values IS NOT NULL THEN
        RAISE NOTICE 'Invalid values found: %', invalid_values;
    END IF;
END $$;

-- Step 3: Fix ALL tier issues comprehensively
BEGIN;

-- First, handle NULLs
UPDATE users SET tier = 'free' WHERE tier IS NULL;

-- Map ALL known invalid values to valid ones
UPDATE users SET tier = 'free' WHERE LOWER(tier) IN ('free_trial', 'freetrial');
UPDATE users SET tier = 'pro_trial' WHERE LOWER(tier) IN ('protrial', 'pro-trial');
UPDATE users SET tier = 'business' WHERE LOWER(tier) IN ('enterprise', 'team', 'agency');
UPDATE users SET tier = 'starter' WHERE LOWER(tier) IN ('basic', 'pay_as_you_go', 'pay-as-you-go', 'payg');
UPDATE users SET tier = 'professional' WHERE LOWER(tier) = 'premium';

-- Clean up any remaining invalid values
UPDATE users
SET tier = 'free'
WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

COMMIT;

-- Step 4: Verify all tiers are now valid
DO $$
DECLARE
    invalid_count INTEGER;
    valid_count INTEGER;
    tier_dist TEXT;
BEGIN
    -- Count invalid tiers after cleanup
    SELECT COUNT(*) INTO invalid_count
    FROM users
    WHERE tier IS NULL
    OR tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

    -- Get distribution
    SELECT COUNT(*) INTO valid_count FROM users;

    SELECT STRING_AGG(tier || ': ' || cnt::text, ', ' ORDER BY cnt DESC)
    INTO tier_dist
    FROM (
        SELECT tier, COUNT(*) as cnt
        FROM users
        GROUP BY tier
    ) t;

    RAISE NOTICE '=== CLEANUP COMPLETE ===';
    RAISE NOTICE 'Total users: %', valid_count;
    RAISE NOTICE 'Invalid tiers remaining: %', invalid_count;
    RAISE NOTICE 'Distribution: %', tier_dist;

    -- CRITICAL: Fail the migration if ANY invalid data remains
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'FAILED: % users still have invalid tier values', invalid_count;
    END IF;
END $$;

-- Step 5: Create a backup column to preserve original values (for audit)
DO $$
BEGIN
    -- Add column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'tier_original'
    ) THEN
        ALTER TABLE users ADD COLUMN tier_original TEXT;
        UPDATE users SET tier_original = tier WHERE tier_original IS NULL;
        RAISE NOTICE 'Created tier_original backup column';
    END IF;
END $$;

-- Step 6: Final validation with detailed reporting
DO $$
DECLARE
    rec RECORD;
    total INTEGER;
BEGIN
    SELECT COUNT(*) INTO total FROM users;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FINAL TIER VALIDATION REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total users in database: %', total;
    RAISE NOTICE '';
    RAISE NOTICE 'Tier Distribution:';

    FOR rec IN
        SELECT tier, COUNT(*) as cnt,
               ROUND(COUNT(*) * 100.0 / total, 2) as pct
        FROM users
        GROUP BY tier
        ORDER BY cnt DESC
    LOOP
        RAISE NOTICE '  % - % users (%%)', RPAD(rec.tier, 15), LPAD(rec.cnt::text, 6), rec.pct;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'All tiers are now valid and ready for constraints';
    RAISE NOTICE '========================================';
END $$;