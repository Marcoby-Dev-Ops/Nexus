// Logger utility that can be disabled in production
class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isEnabled = this.isDevelopment;

  log(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(...args);
    }
  }

  warn(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn(...args);
    }
  }

  error(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error(...args);
    }
  }

  debug(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('🔍', ...args);
    }
  }

  info(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('ℹ️', ...args);
    }
  }

  success(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log('✅', ...args);
    }
  }

  warning(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.warn('⚠️', ...args);
    }
  }

  failure(...args: any[]) {
    if (this.isEnabled) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('❌', ...args);
    }
  }

  // Enable/disable logging
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

export const logger = new Logger(); 