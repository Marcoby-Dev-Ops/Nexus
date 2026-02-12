/**
 * Logger Utility
 */
class Logger {
    info(message: string, data?: any): void {
        // eslint-disable-next-line no-console
        console.info(`[INFO] ${message}`, data || '');
    }

    error(message: string, data?: any): void {
        // eslint-disable-next-line no-console
        console.error(`[ERROR] ${message}`, data || '');
    }

    warn(message: string, data?: any): void {
        // eslint-disable-next-line no-console
        console.warn(`[WARN] ${message}`, data || '');
    }
}

export const logger = new Logger();
