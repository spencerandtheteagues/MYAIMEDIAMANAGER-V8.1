# Google Cloud Deployment Guide for MyAiMediaMgr

## Overview
This guide provides comprehensive instructions for deploying MyAiMediaMgr to Google Cloud Run with full AI content generation capabilities using Vertex AI, Gemini 2.5, Veo3, and Imagen4.

## Prerequisites
- Google Cloud Platform (GCP) account with billing enabled
- Google Cloud SDK (gcloud CLI) installed locally
- Docker installed (for local testing)
- Node.js 20+ installed

## Step 1: GCP Project Setup

### 1.1 Create a New Project
```bash
# Create new project
gcloud projects create myaimediamgr-prod --name="MyAiMediaMgr Production"

# Set as active project
gcloud config set project myaimediamgr-prod

# Enable billing (replace with your billing account ID)
gcloud beta billing projects link myaimediamgr-prod --billing-account=BILLING_ACCOUNT_ID
```

### 1.2 Enable Required APIs
```bash
# Enable all necessary APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com
```

## Step 2: Service Account Configuration

### 2.1 Create Service Account
```bash
# Create service account
gcloud iam service-accounts create myaimediamgr-sa \
  --display-name="MyAiMediaMgr Service Account"

# Get service account email
SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:MyAiMediaMgr Service Account" --format="value(email)")
```

### 2.2 Grant Required Permissions
```bash
# Grant necessary roles
gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker"

gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

### 2.3 Create Service Account Key
```bash
# Create and download key
gcloud iam service-accounts keys create ./service-account-key.json \
  --iam-account=${SA_EMAIL}

# IMPORTANT: Keep this file secure and never commit it to version control
```

## Step 3: Vertex AI Setup

### 3.1 Enable Vertex AI Models
```bash
# Initialize Vertex AI
gcloud ai models list --region=us-central1

# Note: Gemini 2.5, Imagen4, and Veo3 access may require:
# 1. Requesting access through Google Cloud Console
# 2. Quota increases for specific models
# 3. Acceptance of additional terms of service
```

### 3.2 Request Model Access
1. Navigate to Vertex AI in Google Cloud Console
2. Go to "Model Garden"
3. Request access for:
   - Gemini 2.5 Flash
   - Gemini 2.5 Pro
   - Imagen 4.0
   - Veo 3 Fast
4. Wait for approval (usually 24-48 hours)

## Step 4: Cloud Storage Setup

### 4.1 Create Storage Bucket
```bash
# Create bucket for media storage
gsutil mb -p myaimediamgr-prod -c STANDARD -l us-central1 gs://myaimediamgr-content/

# Set bucket permissions for public access
gsutil iam ch allUsers:objectViewer gs://myaimediamgr-content
```

### 4.2 Configure CORS
Create `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["*"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS configuration:
```bash
gsutil cors set cors.json gs://myaimediamgr-content
```

## Step 5: Database Setup (Cloud SQL)

### 5.1 Create PostgreSQL Instance
```bash
# Create Cloud SQL instance
gcloud sql instances create myaimediamgr-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --no-assign-ip

# Create database
gcloud sql databases create myaimediamgr \
  --instance=myaimediamgr-db

# Create user
gcloud sql users create dbuser \
  --instance=myaimediamgr-db \
  --password=SECURE_PASSWORD_HERE
```

### 5.2 Get Connection String
```bash
# Get connection name
gcloud sql instances describe myaimediamgr-db --format="value(connectionName)"
# Output: PROJECT_ID:REGION:INSTANCE_NAME
```

## Step 6: Secret Manager Setup

### 6.1 Create Secrets
```bash
# Database URL
echo -n "postgresql://dbuser:PASSWORD@/myaimediamgr?host=/cloudsql/CONNECTION_NAME" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Gemini API Key (get from Google AI Studio)
echo -n "YOUR_GEMINI_API_KEY" | \
  gcloud secrets create GEMINI_API_KEY --data-file=-

# Session Secret
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create SESSION_SECRET --data-file=-

# GCP Configuration
echo -n "myaimediamgr-prod" | \
  gcloud secrets create GCLOUD_PROJECT_ID --data-file=-

echo -n "us-central1" | \
  gcloud secrets create GCLOUD_LOCATION --data-file=-

echo -n "myaimediamgr-content" | \
  gcloud secrets create GCLOUD_STORAGE_BUCKET --data-file=-
```

### 6.2 Grant Secret Access
```bash
# Grant Cloud Run access to secrets
for SECRET in DATABASE_URL GEMINI_API_KEY SESSION_SECRET GCLOUD_PROJECT_ID GCLOUD_LOCATION GCLOUD_STORAGE_BUCKET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Step 7: Application Configuration

### 7.1 Update Environment Variables
Create `.env.production`:
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://dbuser:PASSWORD@/myaimediamgr?host=/cloudsql/CONNECTION_NAME
GEMINI_API_KEY=your-gemini-api-key
SESSION_SECRET=your-session-secret
GCLOUD_PROJECT_ID=myaimediamgr-prod
GCLOUD_LOCATION=us-central1
GCLOUD_STORAGE_BUCKET=myaimediamgr-content
GCLOUD_KEY_FILE=/app/service-account-key.json
```

### 7.2 Update Application Code
Ensure your application uses environment variables:
```javascript
// server/index.ts
const port = process.env.PORT || 8080;
```

## Step 8: Deployment

### 8.1 Build and Push Container
```bash
# Build container
docker build -t gcr.io/myaimediamgr-prod/myaimediamgr:latest .

# Push to Container Registry
docker push gcr.io/myaimediamgr-prod/myaimediamgr:latest
```

### 8.2 Deploy to Cloud Run
```bash
gcloud run deploy myaimediamgr \
  --image gcr.io/myaimediamgr-prod/myaimediamgr:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account ${SA_EMAIL} \
  --add-cloudsql-instances PROJECT_ID:REGION:myaimediamgr-db \
  --set-env-vars NODE_ENV=production \
  --set-secrets="DATABASE_URL=DATABASE_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,SESSION_SECRET=SESSION_SECRET:latest,GCLOUD_PROJECT_ID=GCLOUD_PROJECT_ID:latest,GCLOUD_LOCATION=GCLOUD_LOCATION:latest,GCLOUD_STORAGE_BUCKET=GCLOUD_STORAGE_BUCKET:latest" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 1
```

## Step 9: Continuous Deployment Setup

### 9.1 Connect GitHub Repository
```bash
# Connect repository
gcloud builds connect create github \
  --region=us-central1 \
  --connection=myaimediamgr-github

# Create trigger
gcloud builds triggers create github \
  --repo-name=myaimediamgr \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --region=us-central1
```

### 9.2 Configure Build Permissions
```bash
# Get Cloud Build service account
BUILD_SA=$(gcloud projects describe myaimediamgr-prod --format="value(projectNumber)")@cloudbuild.gserviceaccount.com

# Grant necessary permissions
gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"
```

## Step 10: Custom Domain Setup (Optional)

### 10.1 Map Custom Domain
```bash
# Add domain mapping
gcloud run domain-mappings create \
  --service myaimediamgr \
  --domain yourdomain.com \
  --region us-central1
```

### 10.2 Update DNS Records
Add the following DNS records to your domain:
- Type: A
- Name: @ (or subdomain)
- Value: (provided by Cloud Run)

## Step 11: Monitoring and Logging

### 11.1 Enable Monitoring
```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=myaimediamgr" --limit 50

# Set up alerts
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate above 1%" \
  --condition-threshold-value=0.01
```

### 11.2 Create Dashboard
1. Go to Cloud Console > Monitoring > Dashboards
2. Create new dashboard
3. Add widgets for:
   - Request rate
   - Latency
   - Error rate
   - Container CPU/Memory usage
   - Vertex AI API calls

## Step 12: Cost Optimization

### 12.1 Set Budget Alerts
```bash
gcloud billing budgets create \
  --billing-account=BILLING_ACCOUNT_ID \
  --display-name="MyAiMediaMgr Monthly Budget" \
  --budget-amount=500 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### 12.2 Optimize Resources
- Use Cloud Scheduler to scale down during off-hours
- Implement caching for AI responses
- Use Cloud CDN for static assets
- Set appropriate timeouts for AI operations

## Pricing Estimates

### Monthly Costs (Approximate)
- **Cloud Run**: $20-50 (based on usage)
- **Cloud SQL**: $10-30 (db-f1-micro)
- **Cloud Storage**: $5-20 (based on storage/bandwidth)
- **Vertex AI**:
  - Gemini 2.5 Flash: $0.00001875 per 1K characters
  - Gemini 2.5 Pro: $0.0025 per 1K characters
  - Imagen 4: $0.025 per image
  - Veo 3: $0.10 per video (15 seconds)
- **Estimated Total**: $100-500/month for moderate usage

## Troubleshooting

### Common Issues

#### 1. Vertex AI Models Not Available
- Ensure you have requested access through Model Garden
- Check regional availability
- Verify billing is enabled

#### 2. Authentication Errors
- Verify service account permissions
- Check secret values in Secret Manager
- Ensure Cloud Run has access to secrets

#### 3. Storage Issues
- Verify bucket exists and has correct permissions
- Check CORS configuration
- Ensure service account has storage.admin role

#### 4. Database Connection Failed
- Verify Cloud SQL proxy is enabled in Cloud Run
- Check connection string format
- Ensure database user has proper permissions

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use Secret Manager for all sensitive data**
3. **Enable VPC Service Controls for additional security**
4. **Implement rate limiting for AI endpoints**
5. **Use Cloud Armor for DDoS protection**
6. **Enable audit logging for all services**
7. **Regularly rotate service account keys**
8. **Implement least privilege access policies**

## Support and Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Documentation](https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

## Contact
For issues specific to the MyAiMediaMgr application, please refer to the application documentation or contact the development team.