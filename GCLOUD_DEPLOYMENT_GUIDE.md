# Google Cloud Deployment Guide for MyAiMediaMgr

## Prerequisites Checklist
- [ ] Google Cloud account with billing enabled
- [ ] `gcloud` CLI installed locally
- [ ] Docker installed (for local testing)
- [ ] Node.js 20+ installed
- [ ] PostgreSQL database (Neon or Cloud SQL)

## Step 1: Google Cloud Project Setup

### 1.1 Create Project
```bash
# Create new project
gcloud projects create myaimediamgr-prod --name="MyAiMediaMgr Production"

# Set as active project
gcloud config set project myaimediamgr-prod

# Link billing account (replace with your billing account ID)
gcloud billing projects link myaimediamgr-prod --billing-account=YOUR_BILLING_ACCOUNT_ID
```

### 1.2 Enable Required APIs
```bash
# Enable all necessary APIs
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  storage-api.googleapis.com \
  storage-component.googleapis.com \
  iam.googleapis.com \
  cloudresourcemanager.googleapis.com \
  compute.googleapis.com
```

## Step 2: IAM Roles and Service Account Setup

### 2.1 Create Service Account
```bash
# Create service account for the application
gcloud iam service-accounts create myaimediamgr-app \
  --display-name="MyAiMediaMgr Application Service Account"

# Get the service account email
export SERVICE_ACCOUNT=myaimediamgr-app@myaimediamgr-prod.iam.gserviceaccount.com
```

### 2.2 Assign Required Roles
```bash
# Vertex AI roles for Gemini, Imagen, and Veo
gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/aiplatform.user"

# Cloud Storage roles
gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/storage.objectAdmin"

# Secret Manager roles
gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Cloud Run invoker (for public access)
gcloud projects add-iam-policy-binding myaimediamgr-prod \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### 2.3 Create Storage Bucket
```bash
# Create bucket for AI-generated content
gsutil mb -p myaimediamgr-prod -c standard -l us-central1 gs://myaimediamgr-content/

# Set public access for content delivery
gsutil iam ch allUsers:objectViewer gs://myaimediamgr-content
```

## Step 3: Configure Secrets

### 3.1 Create Secrets in Secret Manager
```bash
# Database URL (replace with your actual database URL)
echo -n "postgresql://user:password@host/database?sslmode=require" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Session secret (generate a strong random string)
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create SESSION_SECRET --data-file=-

# Replit environment variables (required for OAuth)
echo -n "your-repl-id" | \
  gcloud secrets create REPL_ID --data-file=-

echo -n "your-app-domain.replit.app" | \
  gcloud secrets create REPLIT_DOMAINS --data-file=-

# Grant service account access to secrets
for SECRET in DATABASE_URL SESSION_SECRET REPL_ID REPLIT_DOMAINS; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

## Step 4: Prepare Application for Deployment

### 4.1 Create Dockerfile
```dockerfile
# Multi-stage build for optimization
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./
COPY drizzle.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start the application
CMD ["node", "dist/server/index.js"]
```

### 4.2 Create .gcloudignore
```
node_modules/
.git/
.gitignore
*.md
.env*
.local/
tmp/
*.log
.DS_Store
coverage/
.vscode/
.idea/
*.zip
attached_assets/
```

### 4.3 Create cloudbuild.yaml
```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/myaimediamgr:$COMMIT_SHA', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/myaimediamgr:$COMMIT_SHA']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'myaimediamgr'
      - '--image'
      - 'gcr.io/$PROJECT_ID/myaimediamgr:$COMMIT_SHA'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--service-account'
      - 'myaimediamgr-app@$PROJECT_ID.iam.gserviceaccount.com'
      - '--set-env-vars'
      - 'GCLOUD_PROJECT_ID=$PROJECT_ID,GCLOUD_LOCATION=us-central1,GCLOUD_STORAGE_BUCKET=myaimediamgr-content,NODE_ENV=production,ISSUER_URL=https://replit.com/oidc'
      - '--set-secrets'
      - 'DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,REPL_ID=REPL_ID:latest,REPLIT_DOMAINS=REPLIT_DOMAINS:latest'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '2'
      - '--timeout'
      - '300'
      - '--max-instances'
      - '100'
      - '--min-instances'
      - '0'

images:
  - 'gcr.io/$PROJECT_ID/myaimediamgr:$COMMIT_SHA'

timeout: '1200s'
```

## Step 5: Add Production Configuration

### 5.1 Update package.json scripts
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build --outDir dist/client",
    "build:server": "tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate"
  }
}
```

### 5.2 Create tsconfig.server.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "composite": false,
    "noEmit": false
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist", "client"]
}
```

### 5.3 Add health check endpoint to server/routes.ts
```typescript
// Add this to your routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

### 5.4 Create .env.example
```env
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=your-session-secret
GCLOUD_PROJECT_ID=myaimediamgr-prod
GCLOUD_LOCATION=us-central1
GCLOUD_STORAGE_BUCKET=myaimediamgr-content
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc
```

## Step 6: Deploy to Cloud Run

### 6.1 Initial Deployment
```bash
# Build and deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Alternative: Direct deployment
gcloud run deploy myaimediamgr \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account myaimediamgr-app@myaimediamgr-prod.iam.gserviceaccount.com \
  --set-env-vars GCLOUD_PROJECT_ID=myaimediamgr-prod,GCLOUD_LOCATION=us-central1,GCLOUD_STORAGE_BUCKET=myaimediamgr-content,NODE_ENV=production,ISSUER_URL=https://replit.com/oidc \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest,REPL_ID=REPL_ID:latest,REPLIT_DOMAINS=REPLIT_DOMAINS:latest \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 100
```

### 6.2 Verify Deployment
```bash
# Get service URL
gcloud run services describe myaimediamgr --region us-central1 --format 'value(status.url)'

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=myaimediamgr" --limit 50
```

## Step 7: Post-Deployment Configuration

### 7.1 Set up Custom Domain (Optional)
```bash
# Verify domain ownership
gcloud domains verify yourdomain.com

# Map domain to Cloud Run service
gcloud run domain-mappings create --service myaimediamgr --domain yourdomain.com --region us-central1
```

### 7.2 Configure Monitoring
```bash
# Create uptime check
gcloud monitoring uptime-check-configs create myaimediamgr-health \
  --display-name="MyAiMediaMgr Health Check" \
  --monitored-resource="type=uptime_url,labels={project_id=myaimediamgr-prod,host=your-service-url.run.app}" \
  --http-check-path="/health" \
  --check-frequency=300
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Build Fails
- **Issue**: TypeScript compilation errors
- **Solution**: Run `npm run build` locally first to catch errors
- **Fix**: Ensure all TypeScript errors are resolved before deployment

#### 2. Deployment Fails - Insufficient Permissions
- **Issue**: "Permission denied" errors
- **Solution**: Ensure all IAM roles are correctly assigned:
```bash
gcloud projects get-iam-policy myaimediamgr-prod --flatten="bindings[].members" --format='table(bindings.role)' --filter="bindings.members:myaimediamgr-app@"
```

#### 3. Runtime Errors - Missing Environment Variables
- **Issue**: Application crashes on startup
- **Solution**: Verify all secrets are created and accessible:
```bash
gcloud secrets list
gcloud run services describe myaimediamgr --region us-central1 --format export | grep -A 20 "env:"
```

#### 4. Vertex AI API Errors
- **Issue**: "API not enabled" or permission errors
- **Solution**: Verify API enablement and quota:
```bash
gcloud services list --enabled | grep -E "aiplatform|storage"
gcloud compute project-info describe --format="value(quotas[].metric)" | grep -i vertex
```

#### 5. Database Connection Issues
- **Issue**: Cannot connect to PostgreSQL
- **Solution**: 
  - Ensure DATABASE_URL includes SSL mode: `?sslmode=require`
  - Whitelist Cloud Run outbound IPs if using external database
  - For Neon database, ensure connection pooling is enabled

#### 6. OAuth Authentication Issues
- **Issue**: Replit OAuth not working
- **Solution**:
  - Update REPLIT_DOMAINS secret with your Cloud Run URL
  - Ensure ISSUER_URL is set correctly
  - Update OAuth callback URLs in your Replit settings

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set in Secret Manager
- [ ] Database migrations are run: `npm run db:push`
- [ ] Local build succeeds: `npm run build`
- [ ] Docker image builds locally: `docker build -t myaimediamgr .`
- [ ] All required APIs are enabled
- [ ] Service account has all necessary roles
- [ ] Storage bucket is created and accessible
- [ ] Health check endpoint returns 200 OK
- [ ] All TypeScript errors are resolved
- [ ] Package.json has correct build scripts

## Cost Optimization Tips

1. **Set minimum instances to 0** for development environments
2. **Use Cloud CDN** for static assets
3. **Configure autoscaling** based on actual traffic patterns
4. **Set appropriate memory limits** (2Gi is usually sufficient)
5. **Use regional resources** in the same region as Cloud Run
6. **Implement caching** for AI-generated content

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use Secret Manager** for all sensitive data
3. **Enable VPC Service Controls** for production
4. **Implement rate limiting** on API endpoints
5. **Use Cloud Armor** for DDoS protection
6. **Enable audit logging** for compliance
7. **Regularly update dependencies** for security patches
8. **Use least privilege principle** for IAM roles

## Vertex AI Model Access

### Request Access to Models
1. Navigate to Vertex AI in Google Cloud Console
2. Go to "Model Garden"
3. Request access for:
   - **Gemini 2.5 Flash** (gemini-2.5-flash-002)
   - **Gemini 2.5 Pro** (gemini-2.5-pro-002)
   - **Imagen 4** (imagen-4.0-generate-001)
   - **Veo 3 Fast** (veo-3.0-fast-generate-001)
4. Wait for approval (usually 24-48 hours)

### Pricing Information
- **Gemini 2.5 Flash**: ~$0.00001875 per 1K characters
- **Gemini 2.5 Pro**: ~$0.0025 per 1K characters
- **Imagen 4**: ~$0.025 per image
- **Veo 3 Fast**: ~$0.10 per 8-second video

## Support Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [IAM Best Practices](https://cloud.google.com/iam/docs/best-practices)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

---

## Quick Start Commands Summary

```bash
# Complete deployment in one script
PROJECT_ID=myaimediamgr-prod
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com storage-api.googleapis.com secretmanager.googleapis.com
gcloud iam service-accounts create myaimediamgr-app
gcloud builds submit --config=cloudbuild.yaml
```

This guide ensures your deployment will succeed on the first try by covering all necessary configurations, permissions, and common pitfalls. Follow each step carefully and use the troubleshooting guide if you encounter any issues.