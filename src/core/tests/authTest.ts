import { SessionManager } from '@/core/auth/sessionManager';
import { DatabaseQueryWrapper } from '@/core/database/queryWrapper';
import { logger } from '@/shared/utils/logger';

export const testAuthFlow = async () => {
  const sessionManager = SessionManager.getInstance();
  const queryWrapper = new DatabaseQueryWrapper();
  
  try {
    logger.info('🧪 Testing authentication flow...');
    
    // 1. Ensure session
    const session = await sessionManager.ensureSession();
    logger.info('✅ Session established:', { userId: session.user.id, email: session.user.email });
    
    // 2. Test database query
    const { data, error } = await queryWrapper.getUserProfile(session.user.id);
    
    if (error) {
      logger.error('❌ Database query failed:', error);
      return { success: false, error: error.message };
    }
    
    logger.info('✅ Database query successful:', { profileId: data?.id });
    
    // 3. Test user integrations
    const { data: integrations, error: integrationsError } = await queryWrapper.getUserIntegrations(session.user.id);
    
    if (integrationsError) {
      logger.warn('⚠️ Integrations test failed:', integrationsError);
    } else {
      logger.info('✅ Integrations test successful:', { count: integrations?.length || 0 });
    }
    
    return { 
      success: true, 
      session: {
        userId: session.user.id,
        email: session.user.email,
        hasAccessToken: !!session.access_token
      },
      profile: data,
      integrations: integrations,
      message: 'Authentication flow test completed successfully'
    };
  } catch (error) {
    logger.error('❌ Auth flow test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const testSessionManagement = async () => {
  const sessionManager = SessionManager.getInstance();
  
  try {
    logger.info('🧪 Testing session management...');
    
    // Test session ensure
    const session1 = await sessionManager.ensureSession();
    logger.info('✅ First session ensure:', { userId: session1.user.id });
    
    // Test session caching (should return cached session)
    const session2 = await sessionManager.ensureSession();
    logger.info('✅ Second session ensure (cached):', { userId: session2.user.id });
    
    // Test session clear
    sessionManager.clearSession();
    logger.info('✅ Session cleared');
    
    // Test session re-establishment
    const session3 = await sessionManager.ensureSession();
    logger.info('✅ Third session ensure (after clear):', { userId: session3.user.id });
    
    return { 
      success: true, 
      message: 'Session management test completed successfully',
      sessions: [
        { userId: session1.user.id, email: session1.user.email },
        { userId: session2.user.id, email: session2.user.email },
        { userId: session3.user.id, email: session3.user.email }
      ]
    };
  } catch (error) {
    logger.error('❌ Session management test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const testDatabaseQueries = async () => {
  const queryWrapper = new DatabaseQueryWrapper();
  const sessionManager = SessionManager.getInstance();
  
  try {
    logger.info('🧪 Testing database queries...');
    
    const session = await sessionManager.ensureSession();
    const userId = session.user.id;
    
    // Test user profile query
    const { data: profile, error: profileError } = await queryWrapper.getUserProfile(userId);
    
    if (profileError) {
      logger.error('❌ Profile query failed:', profileError);
      return { success: false, error: profileError.message };
    }
    
    logger.info('✅ Profile query successful:', { profileId: profile?.id });
    
    // Test user integrations query
    const { data: integrations, error: integrationsError } = await queryWrapper.getUserIntegrations(userId);
    
    if (integrationsError) {
      logger.warn('⚠️ Integrations query failed:', integrationsError);
    } else {
      logger.info('✅ Integrations query successful:', { count: integrations?.length || 0 });
    }
    
    // Test company query if user has a company
    if (profile?.company_id) {
      const { data: company, error: companyError } = await queryWrapper.getCompany(profile.company_id);
      
      if (companyError) {
        logger.warn('⚠️ Company query failed:', companyError);
      } else {
        logger.info('✅ Company query successful:', { companyId: company?.id });
      }
    } else {
      logger.info('ℹ️ User has no company, skipping company query test');
    }
    
    return { 
      success: true, 
      message: 'Database queries test completed successfully',
      results: {
        profile: profile ? { id: profile.id, email: profile.email } : null,
        integrations: integrations?.length || 0,
        hasCompany: !!profile?.company_id
      }
    };
  } catch (error) {
    logger.error('❌ Database queries test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}; 