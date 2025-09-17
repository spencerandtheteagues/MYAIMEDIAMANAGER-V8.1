import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import stripeWebhook from "./stripe-webhook";
import { logger } from "./logger";
import { errorHandler, notFoundHandler, handleUnhandledRejections } from "./middleware/errorHandler";

const app = express();

// Trust proxy for rate limiting to work correctly behind proxies
app.set("trust proxy", 1);

// Redirect www to apex domain to maintain OAuth consistency
app.use((req, res, next) => {
  if (req.headers.host === 'www.myaimediamgr.com') {
    return res.redirect(301, `https://myaimediamgr.com${req.originalUrl}`);
  }
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow scripts from self and specific trusted domains only
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React/Vite dev
        "'unsafe-eval'", // Required for React dev mode
        "https://cdn.jsdelivr.net", // For potential CDN assets
        "https://unpkg.com" // For potential CDN assets
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components/CSS-in-JS
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:", // Allow images from HTTPS sources (for social media)
        "*.googleusercontent.com", // For Google OAuth avatars
        "*.googleapis.com" // For Google services
      ],
      connectSrc: [
        "'self'",
        "https:", // HTTPS APIs
        "wss:", // WebSocket connections
        "*.google.com", // Google APIs
        "*.googleapis.com", // Google APIs
        "api.stripe.com", // Stripe payments
        "*.stripe.com" // Stripe services
      ],
      mediaSrc: ["'self'", "blob:", "data:"], // For video/audio content
      objectSrc: ["'none'"], // Disable object/embed for security
      frameSrc: ["'self'", "https://js.stripe.com"], // Only allow trusted frames
      upgradeInsecureRequests: [], // Force HTTPS in production
    },
  },
  crossOriginEmbedderPolicy: false, // Required for some social media APIs
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// CORS configuration - more restrictive in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : process.env.NODE_ENV === 'production'
    ? ['https://myaimediamgr.com', 'https://www.myaimediamgr.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== 'production') {
      // Allow all origins in development
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS blocked origin: ${origin}`, 'SECURITY');
    return callback(new Error('CORS policy violation'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token', // For CSRF protection
    'X-API-Key' // For API key authentication
  ],
  exposedHeaders: ['X-Total-Count'], // For pagination
  optionsSuccessStatus: 200, // For legacy browser support
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

app.use('/api/login', authLimiter);
app.use('/api/callback', authLimiter);

// IMPORTANT: Stripe webhook MUST be registered BEFORE body parser middleware
// to preserve raw body for signature verification
app.use('/api/stripe', stripeWebhook);

// Body parser middleware - MUST come AFTER webhook routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cookie parser for JWT authentication
app.use(cookieParser());

// Serve attached assets (generated images, videos, etc.)
app.use('/attached_assets', express.static('attached_assets'));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Start the publishing scheduler for automated post publishing
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
    try {
      const { publishingScheduler } = await import('./scheduler');
      publishingScheduler.start();
      logger.info('Publishing scheduler started', 'SCHEDULER');
    } catch (error) {
      logger.error('Failed to start publishing scheduler', 'SCHEDULER', error);
    }
  }

  // 404 handler for unmatched routes (must be before error handler)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3001', 10);
  // Setup global error handlers
  handleUnhandledRejections();

  server.listen(port, () => {
    logger.info(`Server listening on port ${port}`, 'SERVER');
  });
})();
