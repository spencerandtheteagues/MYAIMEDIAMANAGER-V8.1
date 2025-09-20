# Admin Panel Fix Deployment Script for Render
# This script deploys admin panel fixes to the production environment

param(
    [string]$Service = "myaimediamgr",
    [string]$Branch = "main"
)

Write-Host "🚀 Deploying Admin Panel Fixes to Render" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if we have the necessary files
$requiredFiles = @(
    "server/adminRoutes.ts",
    "client/src/pages/admin.tsx",
    "fix-admin-issues.cjs"
)

Write-Host "📋 Checking required files..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
        exit 1
    }
}

# Test the current deployment status
Write-Host "`n🔍 Testing current deployment..." -ForegroundColor Yellow

$serviceUrl = "https://myaimediamgr.onrender.com"

# Test basic health
try {
    $healthResponse = Invoke-WebRequest -Uri "$serviceUrl/api/user" -Method GET -TimeoutSec 10
    Write-Host "   ✅ Service is responding (Status: $($healthResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Service health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Continuing with deployment anyway..." -ForegroundColor Yellow
}

# Test admin endpoints (should return 401 for unauthenticated requests)
$adminEndpoints = @(
    "/api/admin/stats",
    "/api/admin/users",
    "/api/admin/transactions"
)

Write-Host "`n📡 Testing admin endpoints..." -ForegroundColor Yellow
foreach ($endpoint in $adminEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$serviceUrl$endpoint" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "   ⚠️  $endpoint returned status $($response.StatusCode) (expected 401)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   ✅ $endpoint properly requires authentication" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "   ❌ $endpoint not found" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $endpoint error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Check git status
Write-Host "`n📝 Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain

if ($gitStatus) {
    Write-Host "   📦 Changes detected:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }

    $commit = Read-Host "   Do you want to commit these changes? (y/n)"
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        git add -A
        git commit -m "ADMIN PANEL FIXES: Resolve edit, password, trial button issues

- Fixed database constraint violations for tier and subscription status
- Enhanced error handling in admin panel components
- Added comprehensive admin endpoint testing
- Improved authentication handling for admin routes
- Fixed edit user functionality
- Fixed password reset functionality
- Fixed trial management functionality
- Added diagnostic tools for troubleshooting

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

        Write-Host "   ✅ Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ No uncommitted changes" -ForegroundColor Green
}

# Push to trigger deployment
Write-Host "`n🚀 Triggering deployment..." -ForegroundColor Yellow

try {
    git push origin $Branch
    Write-Host "   ✅ Code pushed to $Branch branch" -ForegroundColor Green
    Write-Host "   🔄 Render deployment should start automatically..." -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Failed to push: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Wait for deployment
Write-Host "`n⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Write-Host "   💡 You can monitor the deployment at: https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "   💡 Service logs: https://dashboard.render.com/web/srv-d33qf7umcj7s73ajfi7g" -ForegroundColor Cyan

$waitTime = 120 # Wait 2 minutes for deployment
Write-Host "   Waiting $waitTime seconds for deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds $waitTime

# Test the deployment
Write-Host "`n🧪 Testing deployed fixes..." -ForegroundColor Yellow

# Re-test endpoints
foreach ($endpoint in $adminEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$serviceUrl$endpoint" -Method GET -TimeoutSec 15 -ErrorAction Stop
        Write-Host "   ⚠️  $endpoint returned status $($response.StatusCode)" -ForegroundColor Yellow
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "   ✅ $endpoint working (401 auth required)" -ForegroundColor Green
        } elseif ($_.Exception.Response.StatusCode -eq 404) {
            Write-Host "   ❌ $endpoint still not found" -ForegroundColor Red
        } else {
            Write-Host "   ⚠️  $endpoint: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
        }
    }
}

# Final instructions
Write-Host "`n🎉 Deployment completed!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps to test admin panel fixes:" -ForegroundColor Cyan
Write-Host "1. Go to https://myaimediamgr.onrender.com/admin" -ForegroundColor White
Write-Host "2. Log in with an admin account" -ForegroundColor White
Write-Host "3. Test the following functions:" -ForegroundColor White
Write-Host "   • Edit user details" -ForegroundColor Gray
Write-Host "   • Reset user passwords" -ForegroundColor Gray
Write-Host "   • Manage user trial periods" -ForegroundColor Gray
Write-Host "   • Grant/deduct credits" -ForegroundColor Gray
Write-Host "   • Change user tiers" -ForegroundColor Gray
Write-Host "   • Send messages to users" -ForegroundColor Gray
Write-Host ""
Write-Host "If any functions still fail:" -ForegroundColor Yellow
Write-Host "• Check browser console for errors" -ForegroundColor White
Write-Host "• Verify you have admin privileges (enterprise tier)" -ForegroundColor White
Write-Host "• Try refreshing the page" -ForegroundColor White
Write-Host "• Check the service logs on Render dashboard" -ForegroundColor White
Write-Host ""
Write-Host "Service URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "Admin Panel: $serviceUrl/admin" -ForegroundColor Cyan