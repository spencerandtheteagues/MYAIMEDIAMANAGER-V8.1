// server/security.ts
import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

// Enhanced security configuration
export function setupSecurity(app: Express) {
  // Trust proxy for Replit deployment
  app.set('trust proxy', 1);
  
  // Enhanced Helmet configuration with stricter CSP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:", "*.replit.com", "*.replit.dev"],
        mediaSrc: ["'self'", "https:", "blob:"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'", "https://stripe.com"],
        workerSrc: ["'self'", "blob:"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : undefined,
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
  }));
  
  // Enhanced CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  if (process.env.REPLIT_DOMAINS) {
    const replitDomains = process.env.REPLIT_DOMAINS.split(',').map(d => `https://${d}`);
    allowedOrigins.push(...replitDomains);
  }
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (process.env.NODE_ENV === 'development' || 
          allowedOrigins.includes(origin) ||
          origin.endsWith('.replit.dev') ||
          origin.endsWith('.replit.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24 hours
  }));
  
  // Enhanced rate limiting
  const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/ready';
    },
  });
  
  const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  const aiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 AI requests per windowMs
    message: 'Too many AI generation requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  // Apply rate limiters
  app.use('/api/', standardLimiter);
  app.use('/api/auth/', strictLimiter);
  app.use('/api/ai/', aiLimiter);
  
  // Content type validation
  app.use('/api/', (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({ error: 'Content-Type must be application/json' });
      }
    }
    next();
  });
  
  // Prevent clickjacking
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  });
}

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove any script tags specifically
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
}

// SQL injection prevention
export function validateSQLInput(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|AND|OR|NOT|NULL|LIKE|IN|EXISTS|BETWEEN|JOIN|HAVING|GROUP BY|ORDER BY)\b)/gi,
    /(--|#|\/\*|\*\/|xp_|sp_|0x)/gi,
    /(\bINTO\s+OUTFILE\b|\bLOAD_FILE\b)/gi,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return false;
    }
  }
  
  return true;
}

// Environment variable validation
export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Ensure session secret is strong
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.warn('⚠️  SESSION_SECRET should be at least 32 characters long');
  }
  
  // Check for default values in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SESSION_SECRET === 'myaimediamgr-secret-key-change-in-production') {
      console.error('❌ Using default SESSION_SECRET in production! Please set a secure secret.');
      process.exit(1);
    }
  }
}

// Create validation schemas for common inputs
export const emailSchema = z.string().email().max(255);
export const passwordSchema = z.string().min(8).max(100).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
);
export const usernameSchema = z.string().min(3).max(50).regex(
  /^[a-zA-Z0-9_-]+$/,
  'Username can only contain letters, numbers, underscores, and hyphens'
);
export const contentSchema = z.string().max(5000).transform(sanitizeInput);
export const urlSchema = z.string().url().max(2048);