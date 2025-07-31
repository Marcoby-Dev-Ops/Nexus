/**
 * Logger Utility
 * 
 * Provides consistent logging across the application with different levels
 * and environment-specific behavior.
 */

export interface LogLevel {
  DEBUG: 0;
  INFO: 1;
  WARN: 2;
  ERROR: 3;
}

const LOG_LEVELS: LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLogLevel = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

class Logger {
  private shouldLog(level: number): boolean {
    return level >= currentLogLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  // Specialized logging methods
  auth(message: string, data?: any): void {
    this.info(`[AUTH] ${message}`, data);
  }

  api(message: string, data?: any): void {
    this.info(`[API] ${message}`, data);
  }

  db(message: string, data?: any): void {
    this.info(`[DB] ${message}`, data);
  }

  ui(message: string, data?: any): void {
    this.info(`[UI] ${message}`, data);
  }

  performance(message: string, data?: any): void {
    this.info(`[PERF] ${message}`, data);
  }
}

// Export singleton instance
export const logger = new Logger(); 