-- Migration 0005: Fix subscription_status constraint for OAuth signups
-- Generated: 2025-01-19
-- Purpose: Add 'inactive' to allowed subscription_status values for OAuth compatibility

-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_subscription_status;

-- Recreate constraint with 'inactive' added
ALTER TABLE users ADD CONSTRAINT chk_subscription_status
  CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired', 'paused', 'inactive'));

-- Update any existing 'inactive' users to 'trial' if they have needsTrialSelection flag
UPDATE users
SET subscription_status = 'trial'
WHERE subscription_status = 'inactive'
  AND needs_trial_selection = true;

-- For safety, update any remaining 'inactive' users to 'expired'
UPDATE users
SET subscription_status = 'expired'
WHERE subscription_status = 'inactive';