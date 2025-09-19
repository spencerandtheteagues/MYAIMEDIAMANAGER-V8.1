#!/bin/bash
# Render Direct Deployment Script
# This script uses the Render API to trigger deployment with the fixes

echo "🚀 Render Deployment Fix Script"
echo "================================"
echo ""

# Configuration
SERVICE_ID="srv-d33qf7umcj7s73ajfi7g"
API_KEY="rnd_vKob0I2nVrG99ikFj97s3sxKesqT"
REPO_URL="https://github.com/spencerandtheteagues/MAIMM_FINAL_PROD"

echo "📋 Service Details:"
echo "   Service ID: $SERVICE_ID"
echo "   Repository: $REPO_URL"
echo ""

# Step 1: Check current service status
echo "1️⃣ Checking current service status..."
STATUS=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services/$SERVICE_ID" | \
  grep -o '"status":"[^"]*"' | cut -d'"' -f4)

echo "   Current status: $STATUS"
echo ""

# Step 2: Get latest deployment info
echo "2️⃣ Getting latest deployment info..."
LATEST_DEPLOY=$(curl -s -H "Authorization: Bearer $API_KEY" \
  "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=1" | \
  grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "   Latest deployment: $LATEST_DEPLOY"
echo ""

# Step 3: Trigger new deployment with clear cache
echo "3️⃣ Triggering new deployment..."
echo "   This will:"
echo "   - Clear build cache"
echo "   - Run emergency tier fix migration"
echo "   - Apply all database constraints"
echo ""

RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": true}' \
  "https://api.render.com/v1/services/$SERVICE_ID/deploys")

DEPLOY_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$DEPLOY_ID" ]; then
  echo "❌ Failed to trigger deployment"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ Deployment triggered successfully!"
echo "   Deploy ID: $DEPLOY_ID"
echo ""

# Step 4: Monitor deployment
echo "4️⃣ Monitoring deployment progress..."
echo "   (This may take 5-10 minutes)"
echo ""

# Function to check deploy status
check_deploy_status() {
  curl -s -H "Authorization: Bearer $API_KEY" \
    "https://api.render.com/v1/services/$SERVICE_ID/deploys/$1" | \
    grep -o '"status":"[^"]*"' | cut -d'"' -f4
}

# Monitor loop
DEPLOY_STATUS=""
COUNTER=0
MAX_CHECKS=60  # 10 minutes max

while [ "$DEPLOY_STATUS" != "live" ] && [ "$DEPLOY_STATUS" != "build_failed" ] && [ "$DEPLOY_STATUS" != "canceled" ] && [ $COUNTER -lt $MAX_CHECKS ]; do
  sleep 10
  COUNTER=$((COUNTER + 1))
  DEPLOY_STATUS=$(check_deploy_status $DEPLOY_ID)

  # Show progress
  case $DEPLOY_STATUS in
    "build_in_progress")
      echo "   🔨 Building... ($COUNTER/60)"
      ;;
    "update_in_progress")
      echo "   📦 Updating... ($COUNTER/60)"
      ;;
    "live")
      echo "   ✅ Deployment successful!"
      ;;
    "build_failed")
      echo "   ❌ Build failed!"
      ;;
    *)
      echo "   Status: $DEPLOY_STATUS ($COUNTER/60)"
      ;;
  esac
done

echo ""

# Step 5: Final status
if [ "$DEPLOY_STATUS" = "live" ]; then
  echo "🎉 Deployment completed successfully!"
  echo ""
  echo "✅ Your app is now live at: https://myaimediamgr.onrender.com"
  echo ""
  echo "📊 Next steps:"
  echo "   1. Check application health: https://myaimediamgr.onrender.com/health"
  echo "   2. Test user login functionality"
  echo "   3. Verify tier-based features work correctly"
else
  echo "❌ Deployment failed or timed out"
  echo "   Final status: $DEPLOY_STATUS"
  echo ""
  echo "🔍 To investigate:"
  echo "   1. Check logs at: https://dashboard.render.com/web/$SERVICE_ID/logs"
  echo "   2. Review deploy at: https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
fi