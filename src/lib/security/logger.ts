/**
 * Security Logger
 * 
 * Provides logging functionality for security-related events and operations
 */

export interface LogLevel {
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
}

class SecurityLogger implements LogLevel {
  private prefix = '[SECURITY]';

  error(...args: any[]): void {
    console.error(this.prefix, ...args);
  }

  warn(...args: any[]): void {
    console.warn(this.prefix, ...args);
  }

  info(...args: any[]): void {
    console.info(this.prefix, ...args);
  }

  debug(...args: any[]): void {
    console.debug(this.prefix, ...args);
  }

  trace(...args: any[]): void {
    console.trace(this.prefix, ...args);
  }
}

export const logger = new SecurityLogger();
