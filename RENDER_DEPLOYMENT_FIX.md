# Render Deployment Fix Guide

## Problem Summary
Deployments failing with: `check constraint "chk_user_tier" of relation "users" is violated by some row`

## Root Cause
- Invalid tier values in database (NULLs, 'free_trial', etc.)
- Migrations applying constraints before cleaning data
- Migration parser breaking on DO $$ blocks

## Solution Components

### 1. Emergency Tier Fix Migration (`migrations/0000_emergency_tier_fix.sql`)
- Runs FIRST (numbered 0000)
- Drops existing constraints
- Cleans ALL invalid tier values
- Maps common variations to valid values
- Validates all data before proceeding

### 2. Improved Migration Runner (`server/migration-runner.ts`)
- Properly parses DO $$ blocks
- Handles PostgreSQL-specific syntax
- Provides detailed progress logging
- Validates data after each migration

### 3. Pre-Deploy Script (`scripts/pre-deploy.js`)
- Can be run manually before deployment
- Fixes tier values directly in production database
- Shows before/after distribution

## Deployment Steps

### Option A: Manual Fix (Recommended for First Deploy)

1. **Run pre-deploy script locally against production DB:**
```bash
# Set your production DATABASE_URL
export DATABASE_URL="your-production-database-url"
node scripts/pre-deploy.js
```

2. **Commit and push the new files:**
```bash
git add migrations/0000_emergency_tier_fix.sql
git add server/migration-runner.ts
git add scripts/pre-deploy.js
git add RENDER_DEPLOYMENT_FIX.md
git commit -m "Fix tier constraint violations for deployment"
git push origin master
```

3. **Trigger deployment on Render:**
   - Go to https://dashboard.render.com
   - Navigate to your service
   - Click "Manual Deploy" > "Deploy latest commit"

### Option B: Automated Fix via Build Command

1. **Update package.json scripts:**
```json
"scripts": {
  ...
  "migrate": "tsx server/migration-runner.ts",
  "migrate:prod": "node dist/migration-runner.js",
  "pre-deploy": "node scripts/pre-deploy.js",
  ...
}
```

2. **Update render.yaml:**
```yaml
services:
  - type: web
    name: myaimediamgr
    runtime: node
    buildCommand: npm ci && npm run pre-deploy && npm run build
    startCommand: npm start
    ...
```

3. **Commit and push:**
```bash
git add -A
git commit -m "Add automated tier fix to build process"
git push origin master
```

## Verification

### Check Database Directly
```sql
-- Check for invalid tiers
SELECT tier, COUNT(*) as count
FROM users
WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business')
   OR tier IS NULL
GROUP BY tier;

-- If empty result, all tiers are valid!
```

### Check Deployment Logs
Look for these success indicators:
- "All tiers are now valid!"
- "Database is ready for constraints!"
- "Migration complete: X executed, Y skipped"

## Valid Tier Values
The system accepts these tier values:
- `lite` - Lite tier
- `free` - Free tier (default)
- `pro_trial` - Pro trial tier
- `trial` - Trial tier
- `starter` - Starter paid tier
- `pro` - Pro tier
- `professional` - Professional tier
- `business` - Business/Enterprise tier

## Troubleshooting

### If deployment still fails:

1. **Connect to production database:**
```bash
# Using Render's psql connection
render db:connect myaimediamgr
```

2. **Run manual fix:**
```sql
-- Drop constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_tier;

-- Fix all invalid values
UPDATE users SET tier = 'free' WHERE tier IS NULL;
UPDATE users SET tier = 'free' WHERE tier NOT IN ('lite', 'free', 'pro_trial', 'trial', 'starter', 'pro', 'professional', 'business');

-- Verify
SELECT DISTINCT tier FROM users;
```

3. **Retry deployment**

## Files Created
- `migrations/0000_emergency_tier_fix.sql` - Emergency data cleanup
- `server/migration-runner.ts` - Improved migration runner
- `scripts/pre-deploy.js` - Pre-deployment fixer
- `RENDER_DEPLOYMENT_FIX.md` - This guide

## Next Steps
After successful deployment:
1. Monitor application health at `/health`
2. Verify user authentication works
3. Check that tier-based features function correctly
4. Consider adding monitoring for tier value changes