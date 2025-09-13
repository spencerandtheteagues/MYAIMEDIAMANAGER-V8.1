import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Initialize SendGrid
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

// Email configuration
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@myaimediamgr.com';
const APP_NAME = 'MyAI MediaMgr';
const APP_URL = process.env.APP_URL || 'https://myaimediamgr.com';

// Generate a secure 6-digit verification code
export function generateVerificationCode(): string {
  // Generate cryptographically secure random number between 100000 and 999999
  const buffer = crypto.randomBytes(3);
  const code = (buffer.readUIntBE(0, 3) % 900000) + 100000;
  return code.toString();
}

// Hash the verification code for secure storage
export async function hashVerificationCode(code: string): Promise<string> {
  return await bcrypt.hash(code, 10);
}

// Verify a code against its hash
export async function verifyCode(code: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(code, hash);
}

// Email template for verification code
function getVerificationEmailTemplate(code: string, expiryMinutes: number = 10): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 2px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .content {
      background: white;
      border-radius: 14px;
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .verification-code {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      text-align: center;
      padding: 20px;
      border-radius: 12px;
      margin: 30px 0;
    }
    .message {
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
      color: #92400e;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="content">
        <div class="logo">
          <h1>${APP_NAME}</h1>
        </div>
        
        <h2 style="color: #1f2937; text-align: center; margin-bottom: 10px;">Verify Your Email Address</h2>
        
        <p class="message">
          Welcome to ${APP_NAME}! To complete your registration and ensure the security of your account, 
          please enter the verification code below:
        </p>
        
        <div class="verification-code">
          ${code}
        </div>
        
        <p class="message" style="text-align: center; font-weight: 500;">
          This code will expire in ${expiryMinutes} minutes
        </p>
        
        <div class="warning">
          <strong>Security Notice:</strong> This code was requested for your ${APP_NAME} account. 
          If you didn't request this code, please ignore this email. Your account remains secure.
        </div>
        
        <div class="footer">
          <p>This is an automated message from ${APP_NAME}.</p>
          <p>Please do not reply to this email.</p>
          <p style="margin-top: 10px;">
            <a href="${APP_URL}">Visit ${APP_NAME}</a> | 
            <a href="${APP_URL}/help">Get Help</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send verification email
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  if (!apiKey) {
    console.error('SendGrid API key not configured. Email will not be sent.');
    console.log(`[DEV MODE] Verification code for ${email}: ${code}`);
    return true; // Return true in dev mode to allow testing
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: `Verify your ${APP_NAME} account`,
    text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    html: getVerificationEmailTemplate(code),
  };

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

// Email template for welcome message after verification
function getWelcomeEmailTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${APP_NAME}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 2px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    .content {
      background: white;
      border-radius: 14px;
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .success-icon {
      text-align: center;
      margin: 30px 0;
    }
    .success-icon svg {
      width: 80px;
      height: 80px;
    }
    .message {
      color: #4b5563;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .feature-list {
      background-color: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .feature-list h3 {
      color: #1f2937;
      margin-top: 0;
    }
    .feature-list ul {
      margin: 10px 0;
      padding-left: 20px;
      color: #4b5563;
    }
    .feature-list li {
      margin: 8px 0;
    }
    .cta-button {
      display: block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
      margin: 30px auto;
      max-width: 250px;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="content">
        <div class="logo">
          <h1>${APP_NAME}</h1>
        </div>
        
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="12" fill="url(#gradient)"/>
            <path d="M7 13l3 3 7-7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        <h2 style="color: #1f2937; text-align: center;">Email Verified Successfully!</h2>
        
        <p class="message">
          Congratulations! Your email has been verified and your ${APP_NAME} account is now fully activated. 
          You're ready to start creating amazing AI-powered social media content.
        </p>
        
        <div class="feature-list">
          <h3>What you can do now:</h3>
          <ul>
            <li>Generate engaging social media posts with AI</li>
            <li>Create stunning images and videos</li>
            <li>Schedule content across multiple platforms</li>
            <li>Track your content performance</li>
            <li>Manage campaigns efficiently</li>
          </ul>
        </div>
        
        <p class="message">
          Your free trial includes 50 credits to get you started. Each credit allows you to generate 
          AI-powered content, images, or videos.
        </p>
        
        <a href="${APP_URL}/dashboard" class="cta-button">Go to Dashboard</a>
        
        <div class="footer">
          <p>Welcome to the ${APP_NAME} community!</p>
          <p style="margin-top: 10px;">
            <a href="${APP_URL}">Visit ${APP_NAME}</a> | 
            <a href="${APP_URL}/help">Get Help</a> | 
            <a href="${APP_URL}/pricing">View Plans</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Send welcome email after successful verification
export async function sendWelcomeEmail(email: string): Promise<boolean> {
  if (!apiKey) {
    console.log(`[DEV MODE] Welcome email would be sent to ${email}`);
    return true;
  }

  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: `Welcome to ${APP_NAME} - Email Verified!`,
    text: `Your email has been verified successfully. Welcome to ${APP_NAME}!`,
    html: getWelcomeEmailTemplate(),
  };

  try {
    await sgMail.send(msg);
    console.log(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

// Rate limiting helper
export class RateLimiter {
  private attempts: Map<string, { count: number; resetAt: Date }> = new Map();
  
  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = new Date();
    const attempt = this.attempts.get(key);
    
    if (!attempt || attempt.resetAt < now) {
      this.attempts.set(key, {
        count: 1,
        resetAt: new Date(now.getTime() + this.windowMs)
      });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  getRemainingTime(key: string): number {
    const attempt = this.attempts.get(key);
    if (!attempt) return 0;
    
    const now = new Date();
    if (attempt.resetAt < now) return 0;
    
    return attempt.resetAt.getTime() - now.getTime();
  }
  
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Create rate limiters for email sending
export const emailRateLimiter = new RateLimiter(3, 60 * 60 * 1000); // 3 emails per hour
export const verificationRateLimiter = new RateLimiter(5, 10 * 60 * 1000); // 5 attempts per 10 minutes