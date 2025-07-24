/**
 * useUserContext Hook
 * 
 * Provides enhanced user context for AI components
 * Integrates AI domain with admin domain for better user context
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { supabase } from '@/core/supabase';

export interface AIUserContext {
  // Core user data
  userId: string;
  userRole: string;
  userDepartment: string;
  companyId?: string;
  
  // AI-specific preferences
  aiPreferences: {
    communicationStyle: 'direct' | 'detailed' | 'visual';
    responseLength: 'brief' | 'standard' | 'comprehensive';
    technicalLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredAgents: string[];
  };
  
  // Permission-based access
  permissions: {
    canAccessExecutiveAI: boolean;
    canAccessDepartmentAI: boolean;
    canAccessSpecialistAI: boolean;
    canUseAdvancedFeatures: boolean;
    canAccessBusinessData: boolean;
    canPerformActions: boolean;
  };
  
  // Business context
  businessContext: {
    companyName?: string;
    industry?: string;
    companySize?: string;
    teamMembers: Array<{
      id: string;
      name: string;
      role: string;
      department: string;
    }>;
  };
  
  // Session context
  session: {
    currentPage: string;
    sessionStartTime: Date;
    actions: Array<{
      type: string;
      timestamp: Date;
      details?: any;
    }>;
  };
}

export const useUserContext = () => {
  const { user } = useAuth();
  const [context, setContext] = useState<AIUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Build comprehensive user context
  const buildContext = useCallback(async (authUser: any): Promise<AIUserContext> => {
    try {
      // Get user preferences
      const preferences = await getUserPreferences(authUser.id);
      
      // Calculate permissions
      const permissions = calculatePermissions(authUser);
      
      // Get business context
      const businessContext = await getBusinessContext(authUser);
      
      // Get team members
      const teamMembers = await getTeamMembers(authUser.company_id);

      return {
        userId: authUser.id,
        userRole: authUser.role || 'Team Member',
        userDepartment: authUser.department || 'General',
        companyId: authUser.company_id,
        
        aiPreferences: preferences,
        permissions,
        businessContext: {
          ...businessContext,
          teamMembers
        },
        session: {
          currentPage: window.location.pathname,
          sessionStartTime: new Date(),
          actions: []
        }
      };
    } catch (err) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error building user context: ', err);
      throw err;
    }
  }, []);

  // Initialize context when user changes
  useEffect(() => {
    if (!user) {
      setContext(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    buildContext(user)
      .then(setContext)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [user, buildContext]);

  // Update activity
  const updateActivity = useCallback(async (action: string, details?: any) => {
    if (!context) return;

    const newAction = {
      type: action,
      timestamp: new Date(),
      details
    };

    setContext(prev => prev ? {
      ...prev,
      session: {
        ...prev.session,
        actions: [...prev.session.actions, newAction]
      }
    } : null);

    // Save to database
    if (user?.id) {
      try {
        await supabase
          .from('user_activity')
          .insert({
            userid: user.id,
            action,
            details,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
          });
      } catch (err) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error saving user activity: ', err);
      }
    }
  }, [context, user?.id]);

  // Check permissions
  const hasPermission = useCallback((permission: keyof AIUserContext['permissions']) => {
    return context?.permissions[permission] || false;
  }, [context]);

  // Get AI-appropriate user context for prompts
  const getAIUserContext = useCallback(() => {
    if (!context) return 'User context not available';

    return `
USER CONTEXT FOR AI: Name: ${user?.name || 'User'}
Role: ${context.userRole}
Department: ${context.userDepartment}
Company: ${context.businessContext.companyName || 'Unknown'}

COMMUNICATION PREFERENCES:
- Style: ${context.aiPreferences.communicationStyle}
- Response Length: ${context.aiPreferences.responseLength}
- Technical Level: ${context.aiPreferences.technicalLevel}

BUSINESS CONTEXT:
- Department: ${context.userDepartment}
- Team Size: ${context.businessContext.teamMembers.length} members
- Recent Activity: ${context.session.actions.length} actions this session

PERMISSIONS:
- Executive AI: ${context.permissions.canAccessExecutiveAI ? 'Yes' : 'No'}
- Department AI: ${context.permissions.canAccessDepartmentAI ? 'Yes' : 'No'}
- Advanced Features: ${context.permissions.canUseAdvancedFeatures ? 'Yes' : 'No'}
`;
  }, [context, user?.name]);

  return {
    context,
    loading,
    error,
    updateActivity,
    hasPermission,
    getAIUserContext
  };
};

// Helper functions
async function getUserPreferences(userId: string) {
  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', userId)
      .single();

    const preferences = data?.preferences as any;
    
    return {
      communicationStyle: preferences?.ai_communication_style || 'direct',
      responseLength: preferences?.ai_response_length || 'standard',
      technicalLevel: preferences?.ai_technical_level || 'intermediate',
      preferredAgents: preferences?.preferred_agents || ['executive']
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching user preferences: ', error);
    return {
      communicationStyle: 'direct',
      responseLength: 'standard',
      technicalLevel: 'intermediate',
      preferredAgents: ['executive']
    };
  }
}

function calculatePermissions(user: any) {
  const role = user.role?.toLowerCase() || '';
  
  // Executive roles get full access
  const isExecutive = role.includes('ceo') || role.includes('cto') || role.includes('cfo') || role.includes('coo');
  
  // Department heads get department access
  const isDepartmentHead = role.includes('head') || role.includes('director') || role.includes('manager');
  
  return {
    canAccessExecutiveAI: isExecutive || isDepartmentHead || role.includes('admin'),
    canAccessDepartmentAI: true, // All users can access department AI
    canAccessSpecialistAI: isExecutive || isDepartmentHead || role.includes('specialist'),
    canUseAdvancedFeatures: isExecutive || isDepartmentHead,
    canAccessBusinessData: isExecutive || isDepartmentHead || role.includes('analyst'),
    canPerformActions: isExecutive || isDepartmentHead || role.includes('manager')
  };
}

async function getBusinessContext(user: any) {
  return {
    companyName: user.company?.name,
    industry: user.company?.industry,
    companySize: user.company?.size
  };
}

async function getTeamMembers(companyId?: string) {
  if (!companyId) return [];

  try {
    const { data } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role, department')
      .eq('company_id', companyId);

    return data?.map(user => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
      role: user.role || 'Team Member',
      department: user.department || 'General'
    })) || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error fetching team members: ', error);
    return [];
  }
} 