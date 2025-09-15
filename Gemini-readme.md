# MyAiMediaMgr - Comprehensive Setup Guide

## Overview

MyAiMediaMgr is an AI-powered social media management platform designed specifically for small businesses. The application enables users to create, schedule, approve, and publish content across multiple social media platforms (Instagram, Facebook, X/Twitter, TikTok, LinkedIn) from a single interface. The platform leverages Google Cloud AI services for content generation and includes sophisticated approval workflows, analytics tracking, and performance monitoring.

## Core Features

### AI-Powered Content Generation
- **Text Content**: Uses Gemini 2.5 Flash for intelligent post creation
- **Image Generation**: Implements Imagen4 for custom visual content
- **Video Generation**: Utilizes Veo3 Fast for video content creation
- **Platform-Specific Optimization**: Automatically adapts content for each social media platform

### Multi-Platform Management
- **Supported Platforms**: Instagram, Facebook, X (Twitter), LinkedIn, TikTok
- **OAuth Integration**: Secure token-based authentication for each platform
- **Cross-Platform Publishing**: Schedule and publish to multiple platforms simultaneously
- **Platform-Specific Content Previews**: Visual previews tailored to each platform's format

### Business Management System
- **Credit-Based Pricing**: Profitable pricing model with different subscription tiers
- **Admin System**: Comprehensive administrative controls with infinite credits
- **Stripe Payment Processing**: Secure subscription and payment management
- **User Analytics**: Detailed performance tracking and engagement metrics

## Technical Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with hot module replacement
- **UI Library**: Shadcn/UI components with Radix UI primitives
- **Styling**: Tailwind CSS with custom theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side navigation

### Backend
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OAuth with session management
- **AI Services**: Google Cloud AI Platform (Vertex AI)
- **Payment Processing**: Stripe API integration
- **Storage**: In-memory storage with database migration capability

### Database Schema
- **Users**: Account information, credits, subscriptions, admin flags
- **Platforms**: Social media platform connections and tokens
- **Posts**: Content posts with status tracking and engagement data
- **Campaigns**: Organized content campaigns with AI generation settings
- **Analytics**: Performance metrics and engagement tracking
- **Subscriptions**: User subscription plans and billing information

## Required Environment Variables & API Keys

### Essential Configuration
```env
# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database
PGDATABASE=your_database_name
PGHOST=your_host
PGPASSWORD=your_password
PGPORT=5432
PGUSER=your_username

# Session Management
SESSION_SECRET=your_secure_session_secret_key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_or_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_or_live_your_stripe_public_key

# Google Cloud AI Services (Required for Content Generation)
GCLOUD_PROJECT_ID=your_google_cloud_project_id
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio

# Replit Authentication (Auto-configured in Replit)
REPL_ID=auto_configured_replit_id
REPLIT_DOMAINS=auto_configured_domains
ISSUER_URL=https://replit.com/oidc
```

### API Key Setup Instructions

#### Google Cloud AI Services Setup
1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing project
   - Note your project ID for GCLOUD_PROJECT_ID

2. **Enable Required APIs**:
   - Vertex AI API
   - AI Platform API
   - Cloud Storage API (if using file uploads)

3. **Get Gemini API Key**:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Generate API key for Gemini models
   - Use this for GEMINI_API_KEY

#### Stripe Payment Setup
1. **Create Stripe Account**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Complete account setup and verification

2. **Get API Keys**:
   - Navigate to Developers > API keys
   - Copy "Publishable key" (starts with pk_) for VITE_STRIPE_PUBLIC_KEY
   - Copy "Secret key" (starts with sk_) for STRIPE_SECRET_KEY

3. **Create Products and Pricing**:
   - Go to Products section in Stripe Dashboard
   - Create subscription products matching your pricing tiers
   - Note price IDs for subscription management

#### Database Setup
1. **PostgreSQL Database**:
   - Use Replit's built-in PostgreSQL database (recommended)
   - Or set up external PostgreSQL instance
   - Ensure connection string is properly formatted

2. **Database Migration**:
   ```bash
   npm run db:push
   ```

## Admin System Access

### Admin Credentials
- **Admin Email**: `spencerandtheteagues@gmail.com`
- **Admin Password**: `TheMoonKey8!`
- **Admin Login URL**: `/admin/login`

### Admin Capabilities
- **Infinite Credits**: Admin users get 999,999,999 credits
- **Bypass Paywalls**: Full access to all premium features
- **User Management**: Add/remove credits, delete users
- **System Statistics**: Platform-wide analytics and metrics
- **Content Moderation**: Override approval workflows

### Admin Features
- User credit management (add/subtract credits)
- User deletion capabilities
- System-wide statistics dashboard
- Bypass all Stripe payment requirements
- Access to all AI generation features without limits

## Installation & Deployment

### Local Development
1. **Clone Repository**:
   ```bash
   git clone <repository-url>
   cd myaimediamgr
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy environment variables to your environment
   - Ensure all API keys are properly configured

4. **Database Setup**:
   ```bash
   npm run db:push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Railway Deployment
The application is optimized for Railway deployment with automatic configuration:

1. **Railway Configuration** (railway.json):
   ```json
   {
     "build": {
       "builder": "nixpacks",
       "buildCommand": "npm run build"
     },
     "deploy": {
       "startCommand": "npm start",
       "healthcheckPath": "/api/health",
       "healthcheckTimeout": 30,
       "restartPolicyType": "always"
     }
   }
   ```

2. **Environment Variables**:
   - Set all required environment variables in Railway dashboard
   - Ensure database connection is properly configured

3. **Domain Configuration**:
   - Configure custom domain or use Railway subdomain
   - Update REPLIT_DOMAINS if necessary

## Content Generation Setup

### AI Service Configuration
1. **Google Cloud Project Setup**:
   - Ensure GCLOUD_PROJECT_ID is set correctly
   - Verify Vertex AI APIs are enabled
   - Configure authentication credentials

2. **Gemini API Configuration**:
   - Set GEMINI_API_KEY from Google AI Studio
   - Ensure API quotas are sufficient for your usage

3. **Content Generation Features**:
   - **Text Generation**: Gemini 2.5 Flash for post content
   - **Image Generation**: Imagen4 for visual content (requires Vertex AI)
   - **Video Generation**: Veo3 Fast for video content (requires Vertex AI)

### AI Content Generation Workflow
1. **Campaign Creation**: Users create campaigns with business context
2. **AI Prompt Generation**: System generates optimized prompts
3. **Content Creation**: AI services generate text, images, and videos
4. **Platform Optimization**: Content adapted for each social platform
5. **Review & Approval**: Human oversight before publishing
6. **Scheduled Publishing**: Automated posting to connected platforms

## Social Media Platform Connections

### Supported Platforms & OAuth Setup
1. **Instagram Business**:
   - Requires Facebook Developer App
   - Business account required for API access
   - Permissions: pages_manage_posts, pages_read_engagement

2. **Facebook Pages**:
   - Facebook Developer App required
   - Page management permissions needed
   - Business verification may be required

3. **X (Twitter)**:
   - Twitter Developer Account required
   - App creation and approval needed
   - API v2 access with proper scopes

4. **LinkedIn**:
   - LinkedIn Developer Program access
   - Company page association required
   - Marketing API access needed

5. **TikTok for Business**:
   - TikTok for Business account required
   - Marketing API access application
   - Content publishing permissions

### OAuth Implementation
- **Secure Token Storage**: Encrypted token management
- **Automatic Refresh**: Token refresh handling
- **Connection Status**: Real-time connection monitoring
- **Error Handling**: Graceful OAuth error management

## Subscription Plans & Pricing

### Available Plans
1. **Free Trial**: 50 credits/month, 2 platforms, basic features
2. **Starter**: $29/month, 500 credits, 5 platforms, image generation
3. **Professional**: $99/month, 2000 credits, unlimited platforms, video generation
4. **Enterprise**: $299/month, 10000 credits, all features, priority support

### Credit System
- **Text Generation**: 1-5 credits per post (based on complexity)
- **Image Generation**: 10-20 credits per image
- **Video Generation**: 50-100 credits per video
- **Platform Publishing**: 1 credit per platform per post

## Security & Compliance

### Data Security
- **Encrypted Connections**: HTTPS/TLS for all communications
- **Secure Token Storage**: Encrypted OAuth tokens
- **Session Management**: Secure session handling
- **Input Validation**: Comprehensive input sanitization

### Privacy Compliance
- **Data Minimization**: Only collect necessary user data
- **User Consent**: Clear consent for data usage
- **Data Retention**: Configurable data retention policies
- **GDPR Compliance**: European data protection compliance

## Monitoring & Analytics

### System Monitoring
- **Performance Metrics**: Response times and system health
- **Error Tracking**: Comprehensive error logging
- **Usage Analytics**: Credit consumption and feature usage
- **Platform Health**: Social media connection status

### User Analytics
- **Engagement Tracking**: Likes, comments, shares, reach
- **Performance Metrics**: Post success rates and timing
- **Platform Comparison**: Cross-platform performance analysis
- **ROI Tracking**: Content investment vs. engagement returns

## Troubleshooting

### Common Issues
1. **AI Generation Failures**:
   - Verify GCLOUD_PROJECT_ID and GEMINI_API_KEY
   - Check API quotas and billing
   - Ensure proper permissions

2. **Platform Connection Issues**:
   - Verify OAuth app configurations
   - Check token expiration and refresh
   - Validate platform API access

3. **Payment Processing Problems**:
   - Confirm Stripe API keys
   - Verify webhook configurations
   - Check subscription status

### Development Mode
- **No AI Features**: When GCLOUD_PROJECT_ID is missing, AI features are disabled
- **Mock Data Removed**: Users start with clean slate
- **Local Testing**: All features work locally with proper configuration

## Support & Maintenance

### Regular Maintenance
- **Database Backups**: Regular PostgreSQL backups
- **Token Refresh**: Monitoring OAuth token health
- **API Quota Monitoring**: Tracking usage limits
- **Security Updates**: Regular dependency updates

### Scaling Considerations
- **Database Optimization**: Query optimization for large datasets
- **CDN Integration**: Content delivery optimization
- **Caching Strategy**: Redis caching for performance
- **Load Balancing**: Multiple instance deployment

This comprehensive setup ensures MyAiMediaMgr operates at full capacity with all AI-powered content generation features, secure social media integrations, and robust business management capabilities.