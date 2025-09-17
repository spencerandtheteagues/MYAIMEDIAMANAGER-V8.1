import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

function formatErrorResponse(error: ApiError, req: Request) {
  const isProduction = process.env.NODE_ENV === 'production';

  const response: any = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // Only include stack trace in development
  if (!isProduction && error.stack) {
    response.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    response.error.requestId = req.headers['x-request-id'];
  }

  return response;
}

export function errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  // Ensure error has proper structure
  const apiError: ApiError = error instanceof AppError
    ? error
    : new AppError(error.message || 'Internal server error', error.statusCode || 500);

  const statusCode = apiError.statusCode || 500;

  // Log error with appropriate level
  if (statusCode >= 500) {
    logger.error('Server error', 'ERROR_HANDLER', {
      error: apiError.message,
      stack: apiError.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  } else if (statusCode >= 400) {
    logger.warn('Client error', 'ERROR_HANDLER', {
      error: apiError.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      statusCode
    });
  }

  // Send error response
  res.status(statusCode).json(formatErrorResponse(apiError, req));
}

// Async error wrapper - catches async errors and passes to error handler
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Handle unhandled promise rejections
export function handleUnhandledRejections() {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', 'PROCESS', {
      reason: reason?.message || reason,
      stack: reason?.stack
    });
    // Optionally exit process in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', 'PROCESS', {
      error: error.message,
      stack: error.stack
    });
    // Always exit on uncaught exception
    process.exit(1);
  });
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
}