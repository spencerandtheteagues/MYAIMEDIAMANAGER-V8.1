# Google OAuth → Trial Selection Flow - Manual Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the complete Google OAuth to trial/payment flow for new users in MyAiMediaMgr.

## Test Results Summary
✅ **Automated tests passed:**
- New OAuth users created with `needsTrialSelection: true` flag
- Lite trial activates and clears `needsTrialSelection` flag
- `/api/trial/select` endpoint updates user correctly
- API blocks access when trial selection needed

## Manual Testing Steps

### Prerequisites
1. Have access to a Google account that has NOT been used with MyAiMediaMgr before
2. Clear browser cookies/cache or use incognito mode
3. Have access to Stripe test cards for payment verification

### Test 1: New User Google OAuth Flow

#### Steps:
1. **Navigate to the app** (https://myaimediamgr.com or development URL)
2. **Click "Sign in with Google"** on the login page
3. **Authenticate with Google** using a new account
4. **Verify redirect** - You should be redirected to `/trial-selection`

#### Expected Results:
- ✅ User is created in database with `needsTrialSelection: true`
- ✅ User is redirected to `/trial-selection` page
- ✅ User cannot access other app pages until trial is selected

#### Verification:
```sql
-- Check user in database
SELECT id, email, needsTrialSelection, tier, credits, trialVariant 
FROM users 
WHERE email = 'your-test-email@gmail.com';
```

### Test 2: Lite Trial Selection (No Card Required)

#### Steps:
1. **On `/trial-selection` page**, locate the "Lite Trial" card
2. **Review features:**
   - 7 Days Free
   - 30 AI Credits
   - 1 Social Platform
   - 6 Images generation
3. **Click "Start Lite Trial"** button

#### Expected Results:
- ✅ Trial activates immediately (no payment required)
- ✅ User redirected to dashboard
- ✅ User has 30 credits
- ✅ `needsTrialSelection` flag is cleared
- ✅ Trial end date is set to 7 days from now

#### Verification:
```sql
-- Check trial activation
SELECT 
  needsTrialSelection,
  trialVariant,
  trialStartedAt,
  trialEndsAt,
  credits,
  tier,
  trialImagesRemaining,
  trialVideosRemaining
FROM users 
WHERE email = 'your-test-email@gmail.com';
```

### Test 3: Pro Trial Selection (Card Verification Required)

#### Steps:
1. **Create another new Google account** or use database to reset user
2. **Sign in and reach `/trial-selection`**
3. **Click "Start Pro Trial"** button on Pro Trial card
4. **Verify redirect** to `/checkout?plan=professional&trial=true`

#### Expected Results:
- ✅ Redirected to checkout page
- ✅ Checkout shows $1 verification charge
- ✅ Shows 14-day trial details
- ✅ Shows 180 AI credits included

#### Stripe Test Cards:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

### Test 4: Paid Subscription Selection

#### Steps:
1. **On `/trial-selection`**, click "Subscriptions" tab
2. **Select a plan** (Starter, Professional, or Business)
3. **Click "Choose Plan"** button
4. **Verify redirect** to `/checkout?plan={plan_id}`

#### Expected Plans:
- **Starter**: $19/month, 190 credits
- **Professional**: $99/month, 1200 credits  
- **Business**: $199/month, 2500 credits

#### Expected Results:
- ✅ Redirected to checkout with correct plan
- ✅ Checkout shows correct pricing
- ✅ After payment, user has full access
- ✅ `needsTrialSelection` flag is cleared

### Test 5: Access Control During Trial Selection

#### Steps:
1. **While on `/trial-selection`**, try to navigate to:
   - `/dashboard`
   - `/create-content`
   - `/schedule`
   - `/analytics`

#### Expected Results:
- ✅ All routes redirect back to `/trial-selection`
- ✅ API calls return 403 with `needsTrialSelection: true`

### Test 6: Edge Cases

#### Test 6.1: Existing User Signs In
1. **Use an existing Google account** that already has a trial/subscription
2. **Sign in with Google**
3. **Verify** - Should go directly to dashboard, NOT trial selection

#### Test 6.2: Browser Back Button
1. **Complete trial selection**
2. **Use browser back button** to return to `/trial-selection`
3. **Verify** - Should redirect to dashboard (trial already selected)

#### Test 6.3: Direct URL Access
1. **After selecting trial**, try accessing `/trial-selection` directly
2. **Verify** - Should redirect to dashboard

## API Testing with cURL

### Test needsTrialSelection Check:
```bash
# Get session cookie first (replace with actual session)
curl -X GET https://myaimediamgr.com/api/user \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Should return user with needsTrialSelection flag
```

### Test Trial Selection:
```bash
curl -X POST https://myaimediamgr.com/api/trial/select \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d '{"variant": "nocard7"}'

# Should return success and clear needsTrialSelection
```

## Troubleshooting

### Common Issues:

1. **User not redirected to /trial-selection after OAuth**
   - Check `needsTrialSelection` flag in database
   - Verify session middleware is working
   - Check console for redirect errors

2. **Trial not activating**
   - Check network tab for API errors
   - Verify `/api/trial/select` endpoint response
   - Check database for user updates

3. **Stripe checkout not loading**
   - Verify Stripe keys are configured
   - Check browser console for Stripe errors
   - Ensure checkout URL parameters are correct

## Production Checklist

Before deploying to production:

- [ ] Test with real Google account (not test account)
- [ ] Verify SSL certificates for OAuth redirects
- [ ] Test on mobile devices (iOS Safari, Chrome)
- [ ] Verify Stripe webhook handling
- [ ] Check error logging and monitoring
- [ ] Test rate limiting on trial selection
- [ ] Verify email notifications sent

## Support & Debugging

### Database Queries:
```sql
-- Find users needing trial selection
SELECT id, email, createdAt 
FROM users 
WHERE needsTrialSelection = true;

-- Check trial status
SELECT 
  email,
  trialVariant,
  trialStartedAt,
  trialEndsAt,
  credits,
  tier
FROM users 
WHERE email LIKE '%@gmail.com'
ORDER BY createdAt DESC
LIMIT 10;
```

### Log Monitoring:
```bash
# Watch for OAuth errors
grep "OAuth" logs/app.log | tail -f

# Monitor trial selection
grep "trial/select" logs/app.log | tail -f
```

## Success Metrics

The OAuth → Trial flow is working correctly when:

1. **100% of new OAuth users** see trial selection page
2. **0% authentication errors** during OAuth flow
3. **< 2 second** redirect time to trial selection
4. **95%+ conversion** from trial selection to activation
5. **0 unauthorized access** before trial selection

---

*Last Updated: December 2024*
*Version: 1.0*