/**
 * Unified Callback Handler
 * Processes all callback requests using the centralized registry
 */

import type {
  CallbackConfig,
  CallbackRequest,
  CallbackResponse,
  CallbackHandler as CallbackHandlerType
} from '@/core/types/callbacks';
import { CallbackEvent } from '@/core/types/callbacks';
import { callbackRegistry } from '@/shared/callbacks/CallbackRegistry';

/**
 * Built-in callback handlers
 */
export class CallbackHandlers {
  /**
   * Handle OAuth callback
   */
  static async handleOAuthCallback(
    request: CallbackRequest,
    config: CallbackConfig
  ): Promise<CallbackResponse> {
    const { query } = request;
    const { code, state, error } = query;

    try {
      // Handle OAuth error
      if (error) {
        await CallbackHandlers.trackEvent(CallbackEvent.OAUTH_FAILED, {
          integration: config.integrationSlug,
          error: error,
          state: state
        });

        return {
          status: 400,
          body: { error: 'OAuth authorization failed', details: error },
          redirectUrl: config.config.oauth?.redirectUrl ? 
            `${config.config.oauth.redirectUrl}?error=oauth_failed` : undefined
        };
      }

      // Validate required parameters
      if (!code) {
        return {
          status: 400,
          body: { error: 'Missing authorization code' }
        };
      }

      // Validate state if required
      if (config.config.oauth?.validateState && !state) {
        return {
          status: 400,
          body: { error: 'Missing state parameter' }
        };
      }

      // Track OAuth start
      await CallbackHandlers.trackEvent(CallbackEvent.OAUTH_STARTED, {
        integration: config.integrationSlug,
        state: state
      });

      // Process OAuth code exchange
      const tokenData = await CallbackHandlers.exchangeOAuthCode(
        config.integrationSlug,
        code,
        state,
        request.user?.id
      );

      // Track success
      await CallbackHandlers.trackEvent(CallbackEvent.OAUTH_COMPLETED, {
        integration: config.integrationSlug,
        userId: request.user?.id,
        scopes: tokenData.scopes
      });

      // Determine response based on flow type
      if (config.config.oauth?.flowType === 'popup') {
        return {
          status: 200,
          body: `
            <!DOCTYPE html>
            <html>
              <head><title>Authorization Complete</title></head>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>✅ ${config.integrationSlug} Connected Successfully!</h1>
                <p>You can now close this window.</p>
                <script>
                  window.opener?.postMessage({
                    type: 'OAUTH_SUCCESS',
                    integration: '${config.integrationSlug}',
                    data: ${JSON.stringify(tokenData)}
                  }, window.location.origin);
                  setTimeout(() => window.close(), 2000);
                </script>
              </body>
            </html>
          `,
          headers: { 'Content-Type': 'text/html' },
          closePopup: true
        };
      } else {
        // Redirect flow
        const redirectUrl = config.config.oauth?.redirectUrl || '/integrations';
        return {
          status: 302,
          redirectUrl: `${redirectUrl}?success=${config.integrationSlug}`,
          headers: { 'Location': `${redirectUrl}?success=${config.integrationSlug}` }
        };
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      
      await CallbackHandlers.trackEvent(CallbackEvent.OAUTH_FAILED, {
        integration: config.integrationSlug,
        error: error instanceof Error ? error.message : 'Unknown error',
        state: state
      });

      return {
        status: 500,
        body: { error: 'OAuth processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
        redirectUrl: config.config.oauth?.redirectUrl ? 
          `${config.config.oauth.redirectUrl}?error=oauth_processing_failed` : undefined
      };
    }
  }

  /**
   * Handle webhook callback
   */
  static async handleWebhook(
    request: CallbackRequest,
    config: CallbackConfig
  ): Promise<CallbackResponse> {
    try {
      // Track webhook received
      await CallbackHandlers.trackEvent(CallbackEvent.WEBHOOK_RECEIVED, {
        integration: config.integrationSlug,
        headers: Object.keys(request.headers),
        bodySize: JSON.stringify(request.body).length
      });

      // Verify signature if configured
      if (config.security.signatureVerification) {
        const isValid = await CallbackHandlers.verifyWebhookSignature(
          request,
          config.security.signatureVerification
        );

        if (!isValid) {
          return {
            status: 401,
            body: { error: 'Invalid signature' }
          };
        }
      }

      // Validate required headers
      if (config.config.webhook?.requiredHeaders) {
        for (const header of config.config.webhook.requiredHeaders) {
          if (!request.headers[header.toLowerCase()]) {
            return {
              status: 400,
              body: { error: `Missing required header: ${header}` }
            };
          }
        }
      }

      // Process webhook payload
      const result = await CallbackHandlers.processWebhookPayload(
        config.integrationSlug,
        request.body,
        request.headers
      );

      // Track success
      await CallbackHandlers.trackEvent(CallbackEvent.WEBHOOK_PROCESSED, {
        integration: config.integrationSlug,
        eventType: result.eventType,
        recordsProcessed: result.recordsProcessed
      });

      return {
        status: 200,
        body: { success: true, processed: result.recordsProcessed }
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      await CallbackHandlers.trackEvent(CallbackEvent.WEBHOOK_FAILED, {
        integration: config.integrationSlug,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        status: 500,
        body: { error: 'Webhook processing failed' }
      };
    }
  }

  /**
   * Handle API key validation
   */
  static async handleApiKeyValidation(
    request: CallbackRequest,
    config: CallbackConfig
  ): Promise<CallbackResponse> {
    try {
      const apiKeyConfig = config.config.apiKey;
      if (!apiKeyConfig) {
        return {
          status: 400,
          body: { error: 'API key configuration missing' }
        };
      }

      // Extract API key from request
      let apiKey: string | undefined;
      switch (apiKeyConfig.location) {
        case 'header':
          apiKey = request.headers[apiKeyConfig.parameterName.toLowerCase()];
          break;
        case 'query':
          apiKey = request.query[apiKeyConfig.parameterName];
          break;
        case 'body':
          apiKey = request.body?.[apiKeyConfig.parameterName] as string;
          break;
      }

      if (!apiKey) {
        return {
          status: 400,
          body: { error: `API key not found in ${apiKeyConfig.location}` }
        };
      }

      // Validate API key
      const isValid = await CallbackHandlers.validateApiKey(
        config.integrationSlug,
        apiKey,
        apiKeyConfig.validationEndpoint
      );

      if (isValid) {
        await CallbackHandlers.trackEvent(CallbackEvent.API_KEY_VALIDATED, {
          integration: config.integrationSlug,
          userId: request.user?.id
        });

        return {
          status: 200,
          body: { valid: true }
        };
      } else {
        await CallbackHandlers.trackEvent(CallbackEvent.API_KEY_INVALID, {
          integration: config.integrationSlug,
          userId: request.user?.id
        });

        return {
          status: 401,
          body: { valid: false, error: 'Invalid API key' }
        };
      }

    } catch (error) {
      console.error('API key validation error:', error);
      return {
        status: 500,
        body: { error: 'API key validation failed' }
      };
    }
  }

  /**
   * Handle Supabase redirect callback
   * This handles the redirect from Supabase functions back to Nexus
   */
  static async handleSupabaseRedirectCallback(
    request: CallbackRequest,
    config: CallbackConfig
  ): Promise<CallbackResponse> {
    const { query } = request;
    const { success, error, connected } = query;

    try {
      // Track callback received
      await CallbackHandlers.trackEvent(CallbackEvent.CALLBACK_STARTED, {
        integration: config.integrationSlug,
        success: success,
        error: error
      });

      if (error) {
        // Handle error from Supabase function
        await CallbackHandlers.trackEvent(CallbackEvent.OAUTH_FAILED, {
          integration: config.integrationSlug,
          error: error
        });

        return {
          status: 400,
          body: { 
            error: 'Integration connection failed', 
            details: error,
            integration: config.integrationSlug
          },
          redirectUrl: config.config.oauth?.redirectUrl ? 
            `${config.config.oauth.redirectUrl}?error=${error}&integration=${config.integrationSlug}` : undefined
        };
      }

      if (success || connected) {
        // Handle success from Supabase function
        await CallbackHandlers.trackEvent(CallbackEvent.OAUTH_COMPLETED, {
          integration: config.integrationSlug,
          success: success || connected
        });

        return {
          status: 200,
          body: { 
            success: true, 
            message: `${config.integrationSlug} connected successfully`,
            integration: config.integrationSlug
          },
          redirectUrl: config.config.oauth?.redirectUrl ? 
            `${config.config.oauth.redirectUrl}?success=${config.integrationSlug}` : undefined
        };
      }

      // No clear success or error indicator
      return {
        status: 200,
        body: { 
          message: 'Callback received but status unclear',
          integration: config.integrationSlug,
          query: query
        }
      };

    } catch (error) {
      console.error('Supabase redirect callback error:', error);
      
      await CallbackHandlers.trackEvent(CallbackEvent.CALLBACK_FAILED, {
        integration: config.integrationSlug,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        status: 500,
        body: { error: 'Callback processing failed' }
      };
    }
  }



  /**
   * Handle custom callback (fallback)
   */
  static async handleCustomCallback(
    request: CallbackRequest,
    config: CallbackConfig
  ): Promise<CallbackResponse> {
    console.warn(`Custom callback handler not implemented for ${config.integrationSlug}`);
    return {
      status: 501,
      body: { error: 'Custom callback handler not implemented' }
    };
  }

  /**
   * Exchange OAuth code for tokens
   */
  private static async exchangeOAuthCode(
    _integrationSlug: string,
    _code: string,
    _state: string,
    _userId?: string
  ): Promise<any> {
    // This would typically make an API call to exchange the code for tokens
    // and store them in the database
    
    // For now, return a mock response
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
      scopes: ['read', 'write'],
      token_type: 'Bearer'
    };
  }

  /**
   * Verify webhook signature
   */
  private static async verifyWebhookSignature(
    request: CallbackRequest,
    signatureConfig: NonNullable<CallbackConfig['security']['signatureVerification']>
  ): Promise<boolean> {
    const signature = request.headers[signatureConfig.headerName.toLowerCase()];
    if (!signature) return false;

    // Implementation would depend on the signature algorithm
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Process webhook payload
   */
  private static async processWebhookPayload(
    _integrationSlug: string,
    _payload: any,
    _headers: Record<string, string>
  ): Promise<{ eventType: string; recordsProcessed: number }> {
    // This would typically process the webhook payload based on the integration
    // For now, return a mock response
    return {
      eventType: 'data_update',
      recordsProcessed: 1
    };
  }

  /**
   * Validate API key
   */
  private static async validateApiKey(
    _integrationSlug: string,
    apiKey: string,
    _validationEndpoint?: string
  ): Promise<boolean> {
    // This would typically validate the API key against the integration's API
    // For now, return true as a placeholder
    return apiKey.length > 0;
  }

  /**
   * Track callback event
   */
  static async trackEvent(event: CallbackEvent, properties: Record<string, any>): Promise<void> {
    try {
      // This would typically send to an analytics service
      console.log(`Callback Event: ${event}`, properties);
      
      // TODO: Store in database when callback_events table is created
      // For now, just log the event
    } catch (error) {
      console.error('Failed to track callback event:', error);
    }
  }
}

/**
 * Main callback processor
 */
export class CallbackProcessor {
  /**
   * Process a callback request
   */
  static async processCallback(
    path: string,
    method: string,
    query: Record<string, string>,
    body: any,
    headers: Record<string, string>,
    user?: any
  ): Promise<CallbackResponse> {
    const startTime = Date.now();
    
    try {
      // Find matching callback configuration
      const config = callbackRegistry.findByPathPattern(path);
      if (!config) {
        return {
          status: 404,
          body: { error: 'Callback not found' }
        };
      }

      // Check if callback is active
      if (!config.isActive) {
        return {
          status: 503,
          body: { error: 'Callback is currently disabled' }
        };
      }

      // Check if method is allowed
      if (!config.methods.includes(method as any)) {
        return {
          status: 405,
          body: { error: 'Method not allowed' },
          headers: { 'Allow': config.methods.join(', ') }
        };
      }

      // Create callback request
      const request: CallbackRequest = {
        method: method as any,
        path,
        query,
        body,
        headers,
        user,
        integration: {
          id: config.id,
          slug: config.integrationSlug,
          config: config.config as Record<string, unknown>
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userAgent: headers['user-agent'],
          ip: headers['x-forwarded-for'] || headers['x-real-ip']
        }
      };

      // Track callback start
      await CallbackHandlers.trackEvent(CallbackEvent.CALLBACK_STARTED, {
        integration: config.integrationSlug,
        path,
        method,
        requestId: request.metadata.requestId
      });

      // Get handler function
      let handler: CallbackHandlerType;
      if (typeof config.handler === 'string') {
        handler = CallbackProcessor.getBuiltInHandler(config.handler, config.type);
      } else {
        handler = config.handler;
      }

      // Execute handler
      const response = await handler(request, config);

      // Track completion
      await CallbackHandlers.trackEvent(CallbackEvent.CALLBACK_COMPLETED, {
        integration: config.integrationSlug,
        path,
        method,
        requestId: request.metadata.requestId,
        status: response.status,
        duration: Date.now() - startTime
      });

      return response;

    } catch (error) {
      console.error('Callback processing error:', error);
      
      // Track failure
      await CallbackHandlers.trackEvent(CallbackEvent.CALLBACK_FAILED, {
        path,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });

      return {
        status: 500,
        body: { error: 'Internal server error' }
      };
    }
  }

  /**
   * Get built-in handler by name
   */
  private static getBuiltInHandler(handlerName: string, type: string): CallbackHandlerType {
    switch (handlerName) {
      case 'handleOAuthCallback':
        return CallbackHandlers.handleOAuthCallback;
      case 'handleSupabaseRedirectCallback':
        return CallbackHandlers.handleSupabaseRedirectCallback;
      case 'handleWebhook':
        return CallbackHandlers.handleWebhook;
      case 'handleApiKeyValidation':
        return CallbackHandlers.handleApiKeyValidation;
      case 'handleCustomCallback':
        return CallbackHandlers.handleCustomCallback;
      default:
        // Default handler based on type
        switch (type) {
          case 'oauth':
            return CallbackHandlers.handleOAuthCallback;
          case 'webhook':
            return CallbackHandlers.handleWebhook;
          case 'api_key':
            return CallbackHandlers.handleApiKeyValidation;
          default:
            return CallbackHandlers.handleCustomCallback;
        }
    }
  }
}

/**
 * Express/HTTP middleware for callback processing
 */
export const createCallbackMiddleware = () => {
  return async (req: any, res: any, next: any) => {
    try {
      const response = await CallbackProcessor.processCallback(
        req.path,
        req.method,
        req.query || {},
        req.body,
        req.headers,
        req.user
      );

      // Set headers
      if (response.headers) {
        Object.entries(response.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // Handle redirect
      if (response.redirectUrl) {
        res.redirect(response.status, response.redirectUrl);
        return;
      }

      // Send response
      res.status(response.status);
      if (response.body) {
        if (typeof response.body === 'string') {
          res.send(response.body);
        } else {
          res.json(response.body);
        }
      } else {
        res.end();
      }

    } catch (error) {
      next(error);
    }
  };
}; 