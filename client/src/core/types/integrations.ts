/**
 * Centralized Integration Types for Nexus Platform
 * Ensures consistency across all integration components
 */

export type IntegrationDifficulty = 'easy' | 'medium' | 'advanced';
export type IntegrationType = 'oauth' | 'api_key' | 'webhook' | 'credentials';
export type OAuthProvider = 'hubspot' | 'microsoft' | 'google' | 'slack' | 'zapier';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'active';
export type IntegrationCategory = 'crm' | 'payment' | 'email' | 'automation' | 'communication' | 'productivity' | 'accounting' | 'analytics' | 'marketing';
export type ConnectionStatus = 'idle' | 'connecting' | 'testing' | 'success' | 'error' | 'retry';
export type SetupStepType = 'welcome' | 'prerequisites' | 'auth' | 'permissions' | 'configuration' | 'testing' | 'success';

/**
 * Core Integration Definition
 */
export interface Integration {
  id: string;
  name: string;
  slug: string;
  icon: React.ReactNode;
  category: IntegrationCategory;
  difficulty: IntegrationDifficulty;
  authType: IntegrationType;

  // Setup Information
  estimatedSetupTime: string;
  features: string[];
  description?: string;

  // Support & Documentation
  documentation?: string;
  supportUrl?: string;
  videoTutorial?: string;
  prerequisites?: string[];

  // Troubleshooting
  commonIssues?: Array<{
    issue: string;
    solution: string;
    category: 'auth' | 'permissions' | 'network' | 'configuration';
  }>;

  // Configuration Schema
  configSchema?: Record<string, unknown>;
  defaultConfig?: Record<string, unknown>;

  // Platform Metadata
  isActive: boolean;
  isBeta?: boolean;
  isEnterprise?: boolean;
  rateLimits?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };

  // Timestamps
  createdat: string;
  updated_at?: string;
}

/**
 * OAuth Integration Definition
 */
export interface OAuthIntegration {
  id: string;
  userId: string;
  provider: OAuthProvider;
  integrationName: string;
  integrationType: 'oauth';
  status: IntegrationStatus;

  // OAuth-specific fields
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string;
  externalAccountId?: string;
  tenantId?: string;
  lastError?: string;

  // Mail sync (for Microsoft 365)
  mailSyncEnabled?: boolean;
  mailFolders?: string[];
  mailSyncFromDate?: string;

  // Sync information
  lastSyncAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * OAuth Connection Request
 */
export interface OAuthConnectionRequest {
  provider: OAuthProvider;
  userId: string;
  redirectUri: string;
}

/**
 * OAuth Callback Request
 */
export interface OAuthCallbackRequest {
  code: string;
  state: string;
  userId: string;
  redirectUri: string;
  provider: OAuthProvider;
}

/**
 * OAuth Connection Result
 */
export interface OAuthConnectionResult {
  success: boolean;
  message: string;
  integrationId?: string;
  status?: IntegrationStatus;
  externalAccountId?: string;
  tenantId?: string;
  mailSyncEnabled?: boolean;
}

/**
 * Manual Sync Request
 */
export interface ManualSyncRequest {
  integrationId: string;
  userId: string;
}

/**
 * Manual Sync Result
 */
export interface ManualSyncResult {
  success: boolean;
  message: string;
  integrationId: string;
  provider: OAuthProvider;
  syncedAt: string;
  result: {
    contacts?: { count: number; data: any[] };
    companies?: { count: number; data: any[] };
    emails?: { count: number; data: any[] };
  };
}

/**
 * Setup Step Definition with Enhanced Metadata
 */
export interface SetupStep {
  id: string;
  title: string;
  description: string;
  type: SetupStepType;

  // State Management
  completed: boolean;
  optional?: boolean;
  canSkip?: boolean;

  // UX Information
  estimatedTime?: string;
  helpText?: string;
  troubleshootingUrl?: string;

  // Validation
  validation?: {
    required: boolean;
    validator?: (data: unknown) => ValidationResult;
  };

  // Analytics
  analytics?: {
    dropOffRate?: number;
    averageTime?: number;
    commonErrors?: string[];
  };
}

/**
 * Validation Result for Step Validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
}

/**
 * Setup Data Container
 */
export interface SetupData {
  integrationId: string;
  stepData: Record<string, unknown>;
  credentials?: {
    encrypted: boolean;
    data: Record<string, unknown>;
  };
  permissions: Record<string, boolean>;
  configuration: Record<string, unknown>;
  metadata: {
    startTime: string;
    completionTime?: string;
    userAgent: string;
    retryCount: number;
    errors: Array<{
      step: string;
      error: string;
      timestamp: string;
    }>;
  };
}

/**
 * Setup Analytics for Continuous Improvement
 */
export interface SetupAnalytics {
  sessionId: string;
  integrationId: string;
  stepMetrics: Array<{
    stepId: string;
    startTime: number;
    endTime?: number;
    completionRate: number;
    errorCount: number;
    retryCount: number;
  }>;
  totalDuration?: number;
  completionStatus: 'completed' | 'abandoned' | 'error';
  userFeedback?: {
    rating: number;
    comment?: string;
    wouldRecommend: boolean;
  };
  deviceInfo: {
    userAgent: string;
    screenSize: string;
    isMobile: boolean;
  };
}

/**
 * Error Handling Types
 */
export interface IntegrationError {
  code: string;
  message: string;
  category: 'network' | 'auth' | 'permission' | 'validation' | 'rate_limit' | 'server';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  suggestion?: string;
  helpUrl?: string;
  timestamp: string;
}

/**
 * Setup Workflow Configuration
 */
export interface WorkflowConfig {
  maxRetries: number;
  timeoutMs: number;
  enableAnalytics: boolean;
  enableUserFeedback: boolean;
  skipOptionalSteps: boolean;
  theme: 'light' | 'dark' | 'auto';
  locale: string;
}

/**
 * Props for Integration Setup Components
 */
export interface IntegrationSetupProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: SetupData) => void;
  onError?: (error: IntegrationError) => void;
  config?: Partial<WorkflowConfig>;
  initialData?: Partial<SetupData>;
}

/**
 * Hook Return Types for Setup Management
 */
export interface UseIntegrationSetupReturn {
  currentStep: number;
  steps: SetupStep[];
  setupData: SetupData;
  isConnecting: boolean;
  connectionStatus: ConnectionStatus;
  errors: IntegrationError[];
  analytics: SetupAnalytics;

  // Actions
  nextStep: () => void;
  previousStep: () => void;
  skipStep: () => void;
  retryStep: () => void;
  validateStep: (stepId: string) => Promise<ValidationResult>;
  resetSetup: () => void;
  completeSetup: () => Promise<void>;

  // Utilities
  getStepProgress: () => number;
  getEstimatedTimeRemaining: () => string;
  canProceed: () => boolean;
} 
