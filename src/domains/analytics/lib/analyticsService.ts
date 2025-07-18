/**
 * @name analyticsService
 * @description Mock analytics service for event tracking.
 * In a real application, this would be replaced with a proper analytics provider
 * like Segment, PostHog, or a custom analytics solution.
 */

class AnalyticsService {
  private isInitialized = false;

  /**
   * Initializes the analytics service. In a real scenario, this would
   * load an analytics SDK and identify the user.
   * @param {string} userId - The ID of the current user.
   * @param {Record<string, any>} userProperties - Properties associated with the user.
   */
  init(userId: string, userProperties: Record<string, any> = {}) {
    if (this.isInitialized) {
      console.warn('Analytics service already initialized.');
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Initialized for user ${userId}`, userProperties);
    }
    this.isInitialized = true;
  }

  /**
   * Tracks an event with optional properties.
   * @param {string} eventName - The name of the event to track.
   * @param {Record<string, any>} properties - Additional data to send with the event.
   */
  track(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isInitialized) {
      console.warn('Analytics service not initialized. Call init() first.');
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] Event: ${eventName}`, properties);
    }

    // In a real implementation, you would send this to your analytics backend.
    // Example:
    // window.analytics.track(eventName, properties);
  }

  /**
   * Resets the analytics service state, typically on user logout.
   */
  reset() {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Service reset.');
    }
    this.isInitialized = false;
  }
}

export const analyticsService = new AnalyticsService(); 