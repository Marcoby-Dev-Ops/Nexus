/**
 * Enhanced Integration Connector Component
 * 
 * A comprehensive integration component that provides:
 * - Connection management
 * - Best practices and insights
 * - Journey recommendations
 * - Analytics and optimization suggestions
 * - Actionable recommendations for maximizing tool usage
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Settings,
  Plug,
  Database,
  Activity,
  Shield,
  Zap,
  TrendingUp,
  Lightbulb,
  Target,
  BarChart3,
  BookOpen,
  Play,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '@/hooks/index';
import { integrationService } from '@/core/integrations';
import { insightsEngine, type IntegrationInsight, type BestPractice, type JourneyRecommendation } from '@/core/integrations/insights';
import { logger } from '@/shared/utils/logger';
import type { ConnectorType } from '@/core/integrations/registry';

interface EnhancedIntegrationConnectorProps {
  connectorId: ConnectorType;
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, any>;
  customAuthFlow?: () => Promise<void>;
  customIcon?: React.ReactNode;
  customTitle?: string;
  customDescription?: string;
  showInsights?: boolean;
  showBestPractices?: boolean;
  showJourneys?: boolean;
}

interface ConnectionStatus {
  connected: boolean;
  healthy: boolean;
  lastSync?: string;
  error?: string;
  services: Record<string, boolean>;
  metadata?: {
    name?: string;
    version?: string;
    features?: string[];
  };
}

export const EnhancedIntegrationConnector: React.FC<EnhancedIntegrationConnectorProps> = ({
  connectorId,
  onComplete,
  onCancel,
  existingConfig,
  customAuthFlow,
  customIcon,
  customTitle,
  customDescription,
  showInsights = true,
  showBestPractices = true,
  showJourneys = true
}) => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    healthy: false,
    services: {}
  });
  const [loading, setLoading] = useState(false);
  const [authInProgress, setAuthInProgress] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [connectorMetadata, setConnectorMetadata] = useState<any>(null);
  const [insights, setInsights] = useState<IntegrationInsight[]>([]);
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([]);
  const [journeys, setJourneys] = useState<JourneyRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Initialize integration service and get connector metadata
  useEffect(() => {
    const initService = async () => {
      try {
        await integrationService.initialize();
        logger.info(`Enhanced Integration Connector: Service initialized for ${connectorId}`);
        
        // Get connector metadata
        const registry = integrationService.getAvailableConnectors();
        const connector = registry.find(c => c.id === connectorId);
        if (connector) {
          setConnectorMetadata(connector);
        }
        
        await checkConnectionStatus();
        
        // Load insights and best practices
        if (showInsights || showBestPractices) {
          await loadInsightsAndBestPractices();
        }
        
        // Load journey recommendations
        if (showJourneys) {
          await loadJourneyRecommendations();
        }
      } catch (error) {
        logger.error(`Enhanced Integration Connector: Failed to initialize for ${connectorId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    initService();
  }, [connectorId, showInsights, showBestPractices, showJourneys]);

  const checkConnectionStatus = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Check if connector is available
      if (!integrationService.hasConnector(connectorId)) {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          healthy: false,
          error: `${connectorId} connector not available`
        }));
        return;
      }

      // Get connector instance
      const connector = integrationService.getConnectorInstance(connectorId);
      if (!connector) {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          healthy: false,
          error: `${connectorId} connector not initialized`
        }));
        return;
      }

      // Check if we have a valid context
      if (!existingConfig?.accessToken) {
        setConnectionStatus(prev => ({
          ...prev,
          connected: false,
          healthy: false
        }));
        return;
      }

      // Create context for health check
      const ctx = {
        tenantId: user.id,
        installId: `${connectorId}-${user.id}`,
        auth: {
          accessToken: existingConfig.accessToken,
          refreshToken: existingConfig.refreshToken,
          expiresAt: existingConfig.expiresAt,
        },
        config: existingConfig.config || {},
        metadata: {
          provider: connectorId,
          version: connector.version,
        },
      };

      // Perform health check
      const health = await integrationService.healthCheckImmediate(connectorId, ctx);
      
      // Extract service status from health check
      const services: Record<string, boolean> = {};
      if (health.details?.scopeTests) {
        health.details.scopeTests.forEach((test: any) => {
          services[test.scope] = test.status === 'ok';
        });
      }

      setConnectionStatus(prev => ({
        ...prev,
        connected: true,
        healthy: health.healthy,
        error: health.healthy ? undefined : health.details?.error,
        services,
        metadata: {
          name: connector.name,
          version: connector.version,
          features: connector.metadata?.features || []
        }
      }));

    } catch (error) {
      logger.error(`Enhanced Integration Connector: Failed to check connection status for ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        healthy: false,
        error: error instanceof Error ? error.message : String(error)
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadInsightsAndBestPractices = async () => {
    try {
      // Generate insights from mock data (in real app, this would come from actual integration data)
      const mockData = {
        leads: 150,
        contacts: 25,
        manualTasks: 15,
        teams: 2,
        channels: 25,
        failedPayments: 3
      };

      const generatedInsights = insightsEngine.generateInsights(connectorId, mockData, { userId: user?.id });
      setInsights(generatedInsights);

      // Get best practices
      const practices = insightsEngine.getBestPractices(connectorId);
      setBestPractices(practices);
    } catch (error) {
      logger.error(`Enhanced Integration Connector: Failed to load insights for ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const loadJourneyRecommendations = async () => {
    try {
      const recommendations = insightsEngine.getJourneyRecommendations(
        [connectorId],
        ['improve efficiency', 'increase sales'],
        { userId: user?.id }
      );
      setJourneys(recommendations);
    } catch (error) {
      logger.error(`Enhanced Integration Connector: Failed to load journeys for ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleConnect = async () => {
    if (authInProgress) return;
    
    try {
      setAuthInProgress(true);
      
      if (customAuthFlow) {
        await customAuthFlow();
      } else {
        // Default auth flow - redirect to OAuth
        const authUrl = `/api/oauth/authorize/${connectorId}?state=${btoa(JSON.stringify({
          returnTo: window.location.href,
          provider: connectorId,
          ts: Date.now()
        }))}`;
        window.location.href = authUrl;
      }
    } catch (error) {
      logger.error(`Enhanced Integration Connector: Auth failed for ${connectorId}`, { 
        error: error instanceof Error ? error.message : error,
      });
      setAuthInProgress(false);
    }
  };

  const handleSync = async () => {
    if (!user?.id || syncInProgress) return;

    setSyncInProgress(true);
    try {
      // Start a backfill sync using the SDK
      const jobId = await integrationService.startBackfill(
        connectorId,
        user.id,
        `${connectorId}-${user.id}`
      );

      logger.info(`Enhanced Integration Connector: Sync started for ${connectorId}`, { jobId });
      
      // Update status
      setConnectionStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString()
      }));

      // In a real implementation, you'd poll for job status
      // For now, we'll just show success
      setTimeout(() => {
        setSyncInProgress(false);
        checkConnectionStatus();
      }, 2000);

    } catch (error) {
      logger.error(`Enhanced Integration Connector: Failed to start sync for ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      setSyncInProgress(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // In a real implementation, you'd call the SDK to revoke tokens
      // For now, we'll just update the UI
      setConnectionStatus({
        connected: false,
        healthy: false,
        services: {}
      });

      logger.info(`Enhanced Integration Connector: Disconnected ${connectorId}`);
    } catch (error) {
      logger.error(`Enhanced Integration Connector: Failed to disconnect ${connectorId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (!connectionStatus.connected) {
      return <Badge variant="secondary">Disconnected</Badge>;
    }
    if (!connectionStatus.healthy) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="default">Connected</Badge>;
  };

  const getDefaultIcon = () => {
    if (customIcon) return customIcon;
    
    // Default icons based on connector type
    switch (connectorId) {
      case 'microsoft365':
        return <Settings className="h-8 w-8 text-blue-500" />;
      case 'hubspot':
        return <Database className="h-8 w-8 text-orange-500" />;
      case 'slack':
        return <Activity className="h-8 w-8 text-purple-500" />;
      case 'stripe':
        return <Zap className="h-8 w-8 text-purple-500" />;
      case 'google_workspace':
        return <Shield className="h-8 w-8 text-green-500" />;
      default:
        return <Plug className="h-8 w-8 text-gray-500" />;
    }
  };

  const getTitle = () => {
    return customTitle || connectorMetadata?.name || connectorId;
  };

  const getDescription = () => {
    return customDescription || connectorMetadata?.description || `Connect to ${connectorId}`;
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getDefaultIcon()}
          <div>
            <h2 className="text-2xl font-bold">{getTitle()}</h2>
            <p className="text-gray-600">{getDescription()}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {showInsights && <TabsTrigger value="insights">Insights</TabsTrigger>}
          {showBestPractices && <TabsTrigger value="best-practices">Best Practices</TabsTrigger>}
          {showJourneys && <TabsTrigger value="journeys">Journeys</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Checking connection...
                </div>
              ) : connectionStatus.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{connectionStatus.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* Service Status */}
                  {Object.keys(connectionStatus.services).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {Object.entries(connectionStatus.services).map(([service, status]) => (
                        <div key={service} className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="text-sm capitalize">{service}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  {connectionStatus.metadata && (
                    <div className="space-y-2">
                      {connectionStatus.metadata.version && (
                        <div className="text-sm text-gray-600">
                          Version: {connectionStatus.metadata.version}
                        </div>
                      )}
                      {connectionStatus.metadata.features && connectionStatus.metadata.features.length > 0 && (
                        <div className="text-sm text-gray-600">
                          Features: {connectionStatus.metadata.features.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Last Sync */}
                  {connectionStatus.lastSync && (
                    <div className="text-sm text-gray-600">
                      Last sync: {new Date(connectionStatus.lastSync).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            {!connectionStatus.connected ? (
              <Button 
                onClick={handleConnect} 
                disabled={authInProgress}
                className="flex-1"
              >
                {authInProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  `Connect ${getTitle()}`
                )}
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleSync} 
                  disabled={syncInProgress}
                  variant="outline"
                  className="flex-1"
                >
                  {syncInProgress ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync Data'
                  )}
                </Button>
                <Button 
                  onClick={handleDisconnect} 
                  disabled={loading}
                  variant="destructive"
                >
                  Disconnect
                </Button>
              </>
            )}
            
            {onCancel && (
              <Button onClick={onCancel} variant="ghost">
                Cancel
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        {showInsights && (
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Connect your {getTitle()} integration to see personalized insights and recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <Alert key={insight.id} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">{insight.title}</span>
                              <Badge variant="outline" className={getImpactColor(insight.impact)}>
                                {insight.impact}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                            {insight.actionable && insight.actionUrl && (
                              <Button size="sm" variant="outline" className="mt-2">
                                {insight.actionText || 'Take Action'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Best Practices Tab */}
        {showBestPractices && (
          <TabsContent value="best-practices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bestPractices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No best practices available for {getTitle()}.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {bestPractices.map((practice) => (
                      <div key={practice.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg">{practice.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getDifficultyColor(practice.difficulty)}>
                              {practice.difficulty}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4" />
                              {practice.timeToImplement}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{practice.description}</p>
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-2">Implementation:</h4>
                          <p className="text-sm text-gray-600">{practice.implementation}</p>
                        </div>
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-2">Benefits:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {practice.benefits.map((benefit, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-2" />
                          Implement
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Journeys Tab */}
        {showJourneys && (
          <TabsContent value="journeys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Journey Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {journeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Connect more integrations to see journey recommendations.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {journeys.map((journey) => (
                      <div key={journey.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg">{journey.name}</h3>
                          <Badge variant="outline" className={getDifficultyColor(journey.difficulty)}>
                            {journey.difficulty}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{journey.description}</p>
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-2">Steps:</h4>
                          <div className="space-y-2">
                            {journey.steps.map((step, index) => (
                              <div key={step.id} className="flex items-center gap-3 text-sm">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">{step.title}</div>
                                  <div className="text-gray-500">{step.description}</div>
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {step.estimatedTime}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-2">Outcomes:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {journey.outcomes.map((outcome, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {outcome}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button size="sm" variant="outline">
                          <Play className="h-4 w-4 mr-2" />
                          Start Journey
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* SDK Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Nexus Integration SDK
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <div>• Powered by Nexus Integration SDK</div>
            <div>• AI-powered insights and recommendations</div>
            <div>• Best practices baked into every integration</div>
            <div>• Journey-based optimization paths</div>
            <div>• Real-time data synchronization</div>
            <div>• Comprehensive error handling</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedIntegrationConnector;
