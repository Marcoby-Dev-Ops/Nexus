import { supabase } from '@/core/supabase';
import { logger } from '@/shared/utils/logger';

export class SessionManager {
  private static instance: SessionManager;
  private sessionPromise: Promise<any> | null = null;
  private lastSessionCheck = 0;
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async ensureSession(): Promise<any> {
    // Check if we need to refresh the session
    const now = Date.now();
    if (this.sessionPromise && (now - this.lastSessionCheck) < this.SESSION_CHECK_INTERVAL) {
      return this.sessionPromise;
    }

    this.sessionPromise = this.initializeSession();
    this.lastSessionCheck = now;
    return this.sessionPromise;
  }

  private async initializeSession(): Promise<any> {
    try {
      logger.info('Initializing session...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Session error:', error);
        throw new Error(`Session error: ${error.message}`);
      }

      if (!session) {
        logger.warn('No session available');
        throw new Error('No session available');
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        logger.info('Session expired, attempting refresh...');
        const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !newSession) {
          logger.error('Session refresh failed:', refreshError);
          throw new Error('Session expired and refresh failed');
        }
        
        logger.info('Session refreshed successfully');
        return newSession;
      }

      // Ensure session is set in the client
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession || currentSession.access_token !== session.access_token) {
        logger.info('Setting session in client...');
        const { error: setError } = await supabase.auth.setSession(session);
        if (setError) {
          logger.error('Failed to set session:', setError);
          throw new Error('Failed to set session: ' + setError.message);
        }
        logger.info('Session set successfully');
      }

      logger.info('Session initialized successfully', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: session.expires_at
      });

      return session;
    } catch (error) {
      logger.error('Session initialization failed:', error);
      this.sessionPromise = null;
      throw error;
    }
  }

  clearSession() {
    this.sessionPromise = null;
    this.lastSessionCheck = 0;
    logger.info('Session cleared');
  }

  async getCurrentUser(): Promise<any> {
    const session = await this.ensureSession();
    return session.user;
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.ensureSession();
      return true;
    } catch {
      return false;
    }
  }
} 