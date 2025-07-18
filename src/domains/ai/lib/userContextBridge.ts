/**
 * User Context Bridge
 * 
 * Enhances the connection between AI domain and admin domain
 * Provides real-time user context synchronization and permission-based AI access
 */

import { supabase } from '@/core/supabase';

// Define AuthUser type locally to avoid import issues
interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  full_name?: string | null;
  initials?: string;
  avatar_url?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
  role?: string | null;
  department?: string | null;
  company_id?: string | null;
  company?: any;
  integrations?: any[];
  onboardingCompleted?: boolean | null;
  profile?: any;
}

export interface EnhancedUserContext {
  // Core user data
  user: AuthUser;
  
  // Real-time activity
  currentSession: {
    startTime: Date;
    currentPage: string;
    timeOnPage: number;
    actions: Array<{
      type: string;
      timestamp: Date;
      details?: any;
    }>;
  };
  
  // AI-specific context
  aiPreferences: {
    communicationStyle: 'direct' | 'detailed' | 'visual';
    responseLength: 'brief' | 'standard' | 'comprehensive';
    technicalLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredAgents: string[];
    excludedFeatures: string[];
  };
  
  // Permission-based access
  aiPermissions: {
    canAccessExecutiveAI: boolean;
    canAccessDepartmentAI: boolean;
    canAccessSpecialistAI: boolean;
    canUseAdvancedFeatures: boolean;
    canAccessBusinessData: boolean;
    canPerformActions: boolean;
  };
  
  // Business context
  businessContext: {
    department: string;
    role: string;
    company: any;
    recentKPIs: Record<string, any>;
    teamMembers: Array<{
      id: string;
      name: string;
      role: string;
      department: string;
    }>;
  };
}

export class UserContextBridge {
  private static instance: UserContextBridge;
  private userContext: EnhancedUserContext | null = null;
  private listeners: Array<(context: EnhancedUserContext) => void> = [];

  static getInstance(): UserContextBridge {
    if (!UserContextBridge.instance) {
      UserContextBridge.instance = new UserContextBridge();
    }
    return UserContextBridge.instance;
  }

  /**
   * Initialize user context bridge with auth user
   */
  async initialize(user: AuthUser): Promise<EnhancedUserContext> {
    try {
      // Build comprehensive user context
      const enhancedContext = await this.buildEnhancedContext(user);
      
      // Set up real-time listeners
      await this.setupRealtimeListeners(user.id);
      
      this.userContext = enhancedContext;
      this.notifyListeners(enhancedContext);
      
      return enhancedContext;
    } catch (error) {
      console.error('Error initializing user context bridge:', error);
      throw error;
    }
  }

  /**
   * Get current user context
   */
  getCurrentContext(): EnhancedUserContext | null {
    return this.userContext;
  }

  /**
   * Subscribe to context changes
   */
  subscribe(listener: (context: EnhancedUserContext) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update user activity
   */
  async updateActivity(action: string, details?: any): Promise<void> {
    if (!this.userContext) return;

    const newAction = {
      type: action,
      timestamp: new Date(),
      details
    };

    this.userContext.currentSession.actions.push(newAction);
    
    // Update in database
    await this.saveUserActivity(action, details);
    
    this.notifyListeners(this.userContext);
  }

  /**
   * Check if user has permission for specific AI feature
   */
  hasPermission(feature: keyof EnhancedUserContext['aiPermissions']): boolean {
    if (!this.userContext) return false;
    return this.userContext.aiPermissions[feature];
  }

  /**
   * Get AI-appropriate user context for prompts
   */
  getAIUserContext(): string {
    if (!this.userContext) return 'User context not available';

    const { user, aiPreferences, businessContext } = this.userContext;
    
    return `
USER CONTEXT FOR AI:
Name: ${user.name}
Role: ${user.role || 'Team Member'}
Department: ${businessContext.department}
Company: ${businessContext.company?.name || 'Unknown'}

COMMUNICATION PREFERENCES:
- Style: ${aiPreferences.communicationStyle}
- Response Length: ${aiPreferences.responseLength}
- Technical Level: ${aiPreferences.technicalLevel}

BUSINESS CONTEXT:
- Department: ${businessContext.department}
- Team Size: ${businessContext.teamMembers.length} members
- Recent Activity: ${this.userContext.currentSession.actions.length} actions this session

PERMISSIONS:
- Executive AI: ${this.userContext.aiPermissions.canAccessExecutiveAI ? 'Yes' : 'No'}
- Department AI: ${this.userContext.aiPermissions.canAccessDepartmentAI ? 'Yes' : 'No'}
- Advanced Features: ${this.userContext.aiPermissions.canUseAdvancedFeatures ? 'Yes' : 'No'}
`;
  }

  /**
   * Build comprehensive user context
   */
  private async buildEnhancedContext(user: AuthUser): Promise<EnhancedUserContext> {
    // Get user preferences
    const preferences = await this.getUserPreferences(user.id);
    
    // Get business context
    const businessContext = await this.getBusinessContext(user);
    
    // Determine permissions
    const permissions = this.calculatePermissions(user, businessContext);
    
    // Get team members
    const teamMembers = await this.getTeamMembers(user.company_id);

    return {
      user,
      currentSession: {
        startTime: new Date(),
        currentPage: window.location.pathname,
        timeOnPage: 0,
        actions: []
      },
      aiPreferences: preferences,
      aiPermissions: permissions,
      businessContext: {
        ...businessContext,
        teamMembers
      }
    };
  }

  /**
   * Get user AI preferences
   */
  private async getUserPreferences(userId: string) {
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
        preferredAgents: preferences?.preferred_agents || ['executive'],
        excludedFeatures: preferences?.excluded_features || []
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {
        communicationStyle: 'direct',
        responseLength: 'standard',
        technicalLevel: 'intermediate',
        preferredAgents: ['executive'],
        excludedFeatures: []
      };
    }
  }

  /**
   * Get business context
   */
  private async getBusinessContext(user: AuthUser) {
    return {
      department: user.department || 'General',
      role: user.role || 'Team Member',
      company: user.company,
      recentKPIs: await this.getRecentKPIs(user.company_id)
    };
  }

  /**
   * Calculate user permissions based on role and department
   */
  private calculatePermissions(user: AuthUser, businessContext: any) {
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

  /**
   * Get team members for the company
   */
  private async getTeamMembers(companyId?: string): Promise<Array<{id: string, name: string, role: string, department: string}>> {
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
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  /**
   * Get recent KPIs for the company
   */
  private async getRecentKPIs(companyId?: string): Promise<Record<string, any>> {
    if (!companyId) return {};

    try {
      // This would integrate with your business intelligence system
      // For now, return mock data
      return {
        revenue: { current: 125000, previous: 110000, trend: 'up' },
        customers: { current: 150, previous: 140, trend: 'up' },
        satisfaction: { current: 4.2, previous: 4.1, trend: 'up' }
      };
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      return {};
    }
  }

  /**
   * Save user activity to database
   */
  private async saveUserActivity(action: string, details?: any): Promise<void> {
    if (!this.userContext?.user.id) return;

    try {
      await supabase
        .from('user_activity')
        .insert({
          user_id: this.userContext.user.id,
          action,
          details,
          timestamp: new Date().toISOString(),
          page: window.location.pathname
        });
    } catch (error) {
      console.error('Error saving user activity:', error);
    }
  }

  /**
   * Set up real-time listeners for user context updates
   */
  private async setupRealtimeListeners(userId: string): Promise<void> {
    // Listen for profile updates
    const profileChannel = supabase
      .channel(`user-profile-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`
      }, async (payload) => {
        // Refresh user context when profile is updated
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await this.refreshContext(user);
        }
      })
      .subscribe();

    // Listen for company updates
    if (this.userContext?.user.company_id) {
      const companyChannel = supabase
        .channel(`company-${this.userContext.user.company_id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${this.userContext.user.company_id}`
        }, async () => {
          // Refresh business context when company is updated
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await this.refreshContext(user);
          }
        })
        .subscribe();
    }
  }

  /**
   * Refresh user context
   */
  private async refreshContext(user: any): Promise<void> {
    const enhancedContext = await this.buildEnhancedContext(user);
    this.userContext = enhancedContext;
    this.notifyListeners(enhancedContext);
  }

  /**
   * Notify all listeners of context changes
   */
  private notifyListeners(context: EnhancedUserContext): void {
    this.listeners.forEach(listener => {
      try {
        listener(context);
      } catch (error) {
        console.error('Error in context listener:', error);
      }
    });
  }
}

// Export singleton instance
export const userContextBridge = UserContextBridge.getInstance(); 