# Render Direct Deployment Script (PowerShell)
# This script uses the Render API to trigger deployment with the fixes

Write-Host "🚀 Render Deployment Fix Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVICE_ID = "srv-d33qf7umcj7s73ajfi7g"
$API_KEY = "rnd_vKob0I2nVrG99ikFj97s3sxKesqT"
$REPO_URL = "https://github.com/spencerandtheteagues/MAIMM_FINAL_PROD"

Write-Host "📋 Service Details:" -ForegroundColor Yellow
Write-Host "   Service ID: $SERVICE_ID"
Write-Host "   Repository: $REPO_URL"
Write-Host ""

# Step 1: Check current service status
Write-Host "1️⃣ Checking current service status..." -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $API_KEY"
}

try {
    $serviceInfo = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" -Headers $headers -Method Get
    Write-Host "   Current status: $($serviceInfo.status)" -ForegroundColor White
} catch {
    Write-Host "   Unable to fetch status" -ForegroundColor Red
}
Write-Host ""

# Step 2: Get latest deployment info
Write-Host "2️⃣ Getting latest deployment info..." -ForegroundColor Green
try {
    $deploys = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=1" -Headers $headers -Method Get
    if ($deploys -and $deploys.Count -gt 0) {
        Write-Host "   Latest deployment: $($deploys[0].id)" -ForegroundColor White
        Write-Host "   Status: $($deploys[0].status)" -ForegroundColor White
    }
} catch {
    Write-Host "   Unable to fetch deployment info" -ForegroundColor Red
}
Write-Host ""

# Step 3: Trigger new deployment
Write-Host "3️⃣ Triggering new deployment..." -ForegroundColor Green
Write-Host "   This will:" -ForegroundColor Yellow
Write-Host "   - Clear build cache"
Write-Host "   - Run emergency tier fix migration"
Write-Host "   - Apply all database constraints"
Write-Host ""

$deployBody = @{
    clearCache = $true
} | ConvertTo-Json

try {
    $newDeploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/deploys" `
        -Headers $headers `
        -Method Post `
        -Body $deployBody `
        -ContentType "application/json"

    $DEPLOY_ID = $newDeploy.id

    Write-Host "✅ Deployment triggered successfully!" -ForegroundColor Green
    Write-Host "   Deploy ID: $DEPLOY_ID" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Failed to trigger deployment" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Monitor deployment
Write-Host "4️⃣ Monitoring deployment progress..." -ForegroundColor Green
Write-Host "   (This may take 5-10 minutes)" -ForegroundColor Yellow
Write-Host ""

$deployStatus = ""
$counter = 0
$maxChecks = 60  # 10 minutes max

while (($deployStatus -ne "live") -and ($deployStatus -ne "build_failed") -and ($deployStatus -ne "canceled") -and ($counter -lt $maxChecks)) {
    Start-Sleep -Seconds 10
    $counter++

    try {
        $deploy = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" -Headers $headers -Method Get
        $deployStatus = $deploy.status

        # Show progress
        switch ($deployStatus) {
            "build_in_progress" {
                Write-Host "   🔨 Building... ($counter/60)" -ForegroundColor Yellow
            }
            "update_in_progress" {
                Write-Host "   📦 Updating... ($counter/60)" -ForegroundColor Yellow
            }
            "live" {
                Write-Host "   ✅ Deployment successful!" -ForegroundColor Green
            }
            "build_failed" {
                Write-Host "   ❌ Build failed!" -ForegroundColor Red
            }
            default {
                Write-Host "   Status: $deployStatus ($counter/60)" -ForegroundColor White
            }
        }
    } catch {
        Write-Host "   Error checking status: $_" -ForegroundColor Red
    }
}

Write-Host ""

# Step 5: Final status
if ($deployStatus -eq "live") {
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Your app is now live at: https://myaimediamgr.onrender.com" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Check application health: https://myaimediamgr.onrender.com/health"
    Write-Host "   2. Test user login functionality"
    Write-Host "   3. Verify tier-based features work correctly"
} else {
    Write-Host "❌ Deployment failed or timed out" -ForegroundColor Red
    Write-Host "   Final status: $deployStatus" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 To investigate:" -ForegroundColor Yellow
    Write-Host "   1. Check logs at: https://dashboard.render.com/web/$SERVICE_ID/logs"
    Write-Host "   2. Review deploy at: https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
}