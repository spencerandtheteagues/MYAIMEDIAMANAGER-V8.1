import { createWriteStream } from 'fs';
import { join } from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private logStream?: NodeJS.WritableStream;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    if (!this.isDevelopment) {
      try {
        this.logStream = createWriteStream(join(process.cwd(), 'logs', 'app.log'), { flags: 'a' });
      } catch (e) {
        // If we can't create log file, fallback to console only
      }
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} [${level.toUpperCase()}] ${contextStr} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    const formatted = this.formatMessage(level, message, context, data);

    // Always log to console in development, or if no file stream available
    if (this.isDevelopment || !this.logStream) {
      console.log(formatted);
    }

    // Log to file in production
    if (this.logStream) {
      this.logStream.write(formatted + '\n');
    }
  }

  debug(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      this.log('debug', message, context, data);
    }
  }

  info(message: string, context?: string, data?: any): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log('error', message, context, data);
  }

  // Helper method for HTTP requests
  request(method: string, url: string, statusCode: number, duration?: number): void {
    this.info(`${method} ${url} ${statusCode}${duration ? ` (${duration}ms)` : ''}`, 'HTTP');
  }
}

export const logger = new Logger();
export default logger;