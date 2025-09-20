# CRITICAL: Google OAuth Signup Fix - Deployment Instructions

## Issue Fixed
New Google OAuth user signups were failing with:
```
{"message":"new row for relation \"users\" violates check constraint \"chk_subscription_status\""}
```

## Root Cause
- Google OAuth was setting `subscriptionStatus: 'inactive'` for new users
- Database constraint only allowed: `('trial', 'active', 'cancelled', 'expired', 'paused')`
- This prevented ALL new user signups via Google OAuth

## Fixes Applied

### 1. Code Fix (IMMEDIATE)
**File:** `server/google-auth.ts` (Line 31)
- **Changed:** `subscriptionStatus: 'inactive'`
- **To:** `subscriptionStatus: 'trial'`
- This aligns with the database schema default and existing constraint

### 2. Database Migration (BACKWARD COMPATIBILITY)
**File:** `migrations/0005_fix_subscription_status_constraint.sql`
- Adds 'inactive' to allowed values for backward compatibility
- Migrates any existing 'inactive' users to proper status
- Ensures no data loss

## Deployment Steps

### For Render/Railway/Production:

1. **Deploy Code First (URGENT)**
   ```bash
   git add server/google-auth.ts
   git commit -m "fix: Change OAuth subscription_status from 'inactive' to 'trial'"
   git push origin main
   ```

2. **Run Migration**
   ```bash
   # SSH into production or use deployment console
   npm run migrate
   # OR if using a different migration command:
   node scripts/apply-migrations.js
   ```

3. **Verify Fix**
   ```bash
   # Run verification script
   node scripts/verify-oauth-signup-fix.mjs
   ```

4. **Test Google OAuth Flow**
   - Open incognito browser
   - Go to `/auth`
   - Click "Sign in with Google"
   - Use a NEW Google account
   - Verify redirect to `/trial-selection`

## Verification Checklist

- [ ] Code deployed successfully
- [ ] Migration executed without errors
- [ ] No constraint violations in logs
- [ ] New Google OAuth signups work
- [ ] Users redirected to trial selection
- [ ] Existing users can still login

## Monitoring

Watch for these in logs:
- No more `chk_subscription_status` errors
- Successful user creation logs
- Google OAuth callback completions

## Rollback Plan (if needed)

If issues occur:
1. Revert code change (set back to 'inactive')
2. Ensure migration 0005 is applied (adds 'inactive' to constraint)
3. Investigate further

## Impact
- **Critical**: Blocks ALL new user signups via Google
- **Fixed**: Users can now sign up and are properly directed to trial selection
- **No impact on existing users**

## Files Changed
1. `server/google-auth.ts` - Fixed subscription status value
2. `migrations/0005_fix_subscription_status_constraint.sql` - Added migration for constraint
3. `scripts/verify-oauth-signup-fix.mjs` - Verification script

## Status
✅ **FIX COMPLETE - READY FOR DEPLOYMENT**