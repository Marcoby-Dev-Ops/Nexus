/**
 * Unified Communication Platform Setup Component
 * Allows users to connect Microsoft Teams, Slack, or both platforms
 * Provides a unified interface for communication platform integration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  TrendingUp,
  BarChart3,
  Clock,
  Smile,
  FileText,
  MessageCircle,
  Video,
  ArrowRight,
  Plus
} from 'lucide-react';

interface CommunicationPlatformSetupProps {
  onComplete?: (data: unknown) => void;
  onCancel?: () => void;
  existingConfig?: Record<string, unknown>;
}

interface PlatformConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  connected: boolean;
  connecting: boolean;
}

const CommunicationPlatformSetup: React.FC<CommunicationPlatformSetupProps> = ({
  onComplete,
  onCancel,
  existingConfig
}) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [platformStatus, setPlatformStatus] = useState<Record<string, boolean>>({});
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const platforms: PlatformConfig[] = [
    {
      id: 'teams',
      name: 'Microsoft Teams',
      description: 'Connect your Microsoft Teams workspace for comprehensive communication analytics',
      icon: Users,
      color: 'text-blue-600',
      features: [
        'Team collaboration insights',
        'Meeting analytics',
        'Channel activity tracking',
        'Integration with Microsoft 365'
      ],
      connected: platformStatus.teams || false,
      connecting: connectingPlatform === 'teams'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Connect your Slack workspace for team communication intelligence',
      icon: MessageSquare,
      color: 'text-purple-600',
      features: [
        'Channel analytics',
        'Message insights',
        'Team engagement metrics',
        'Real-time collaboration data'
      ],
      connected: platformStatus.slack || false,
      connecting: connectingPlatform === 'slack'
    }
  ];

  const handlePlatformSelect = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(id => id !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const handleConnectPlatform = async (platformId: string) => {
    try {
      setConnectingPlatform(platformId);
      setError(null);

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update platform status
      setPlatformStatus(prev => ({
        ...prev,
        [platformId]: true
      }));

      // Update platform config
      const updatedPlatforms = platforms.map(p => 
        p.id === platformId ? { ...p, connected: true, connecting: false } : p
      );

      // If this was the first platform, complete the setup
      if (Object.values(platformStatus).filter(Boolean).length === 0) {
        onComplete?.({
          platforms: [platformId],
          status: 'connected',
          config: {
            [platformId]: {
              connected: true,
              connectedAt: new Date().toISOString()
            }
          }
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect platform');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleConnectAll = async () => {
    try {
      setError(null);
      
      // Connect all selected platforms
      for (const platformId of selectedPlatforms) {
        await handleConnectPlatform(platformId);
      }

      // Complete setup
      onComplete?.({
        platforms: selectedPlatforms,
        status: 'connected',
        config: selectedPlatforms.reduce((acc, platformId) => ({
          ...acc,
          [platformId]: {
            connected: true,
            connectedAt: new Date().toISOString()
          }
        }), {})
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect platforms');
    }
  };

  const connectedCount = Object.values(platformStatus).filter(Boolean).length;
  const canConnectAll = selectedPlatforms.length > 0 && !connectingPlatform;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Connect Communication Platforms</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose which communication platforms to connect. You can connect one or both platforms 
            to get comprehensive insights across your team's communication channels.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Platform Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const IconComponent = platform.icon;
          const isSelected = selectedPlatforms.includes(platform.id);
          const isConnected = platform.connected;
          const isConnecting = platform.connecting;

          return (
            <Card 
              key={platform.id} 
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary' : ''
              } ${isConnected ? 'bg-success/5 border-success/20' : ''}`}
              onClick={() => !isConnected && handlePlatformSelect(platform.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${platform.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <IconComponent className={`w-5 h-5 ${platform.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{platform.description}</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge variant="default" className="bg-success/10 text-success">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : isSelected ? (
                    <Badge variant="default">
                      Selected
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {platform.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-muted-foreground">
                          <div className="w-1 h-1 bg-muted-foreground rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isConnected ? (
                    <div className="flex items-center justify-center p-3 bg-success/10 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-success mr-2" />
                      <span className="text-sm text-success font-medium">
                        Successfully connected
                      </span>
                    </div>
                  ) : isConnecting ? (
                    <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Connecting to {platform.name}...
                      </span>
                    </div>
                  ) : isSelected ? (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectPlatform(platform.id);
                      }}
                      className="w-full"
                      size="sm"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Connect {platform.name}
                    </Button>
                  ) : (
                    <div className="text-center p-3 border-2 border-dashed border-muted rounded-lg">
                      <Plus className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to select</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Benefits Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Unlock Communication Intelligence</h3>
            <p className="text-muted-foreground">
              Connect your communication platforms to get powerful insights into team collaboration, 
              engagement patterns, and communication efficiency.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Analytics Dashboard</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>Performance Insights</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span>AI Recommendations</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex space-x-3">
          {connectedCount > 0 && (
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 mr-1 text-success" />
              {connectedCount} platform{connectedCount > 1 ? 's' : ''} connected
            </div>
          )}
          
          {canConnectAll && (
            <Button onClick={handleConnectAll} disabled={connectingPlatform !== null}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Connect Selected Platforms
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationPlatformSetup;
