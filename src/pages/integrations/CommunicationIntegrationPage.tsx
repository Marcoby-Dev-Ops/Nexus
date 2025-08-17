/**
 * Communication Integration Page
 * Unified page for connecting communication platforms (Teams and Slack)
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  MessageCircle, 
  Users, 
  MessageSquare, 
  CheckCircle2,
  ArrowLeft,
  Settings
} from 'lucide-react';
import CommunicationPlatformSetup from '@/components/integrations/CommunicationPlatformSetup';

const CommunicationIntegrationPage: React.FC = () => {
  const [showSetup, setShowSetup] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);

  const handleSetupComplete = (data: any) => {
    console.log('Setup completed:', data);
    setConnectedPlatforms(data.platforms || []);
    setShowSetup(false);
  };

  const handleSetupCancel = () => {
    setShowSetup(false);
  };

  if (showSetup) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => setShowSetup(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Overview
          </Button>
        </div>
        <CommunicationPlatformSetup
          onComplete={handleSetupComplete}
          onCancel={handleSetupCancel}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Communication Intelligence</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Connect your communication platforms to unlock powerful team insights
            </p>
          </div>
          <Button onClick={() => setShowSetup(true)}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Connect Platforms
          </Button>
        </div>
      </div>

      {/* Platform Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Microsoft Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span>Microsoft Teams</span>
              </div>
              {connectedPlatforms.includes('teams') ? (
                <Badge variant="default" className="bg-success/10 text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectedPlatforms.includes('teams') ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">1,247</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">23</div>
                    <div className="text-sm text-muted-foreground">Meetings</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span className="font-medium">12min</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Connection
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Connect Microsoft Teams to get meeting and communication insights
                </p>
                <Button onClick={() => setShowSetup(true)}>
                  Connect Teams
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <span>Slack</span>
              </div>
              {connectedPlatforms.includes('slack') ? (
                <Badge variant="default" className="bg-success/10 text-success">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectedPlatforms.includes('slack') ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold">2,847</div>
                    <div className="text-sm text-muted-foreground">Messages</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">15</div>
                    <div className="text-sm text-muted-foreground">Channels</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Avg Response Time</span>
                  <span className="font-medium">18min</span>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Connection
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Connect Slack to get channel and message insights
                </p>
                <Button onClick={() => setShowSetup(true)}>
                  Connect Slack
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold">Why Connect Communication Platforms?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Get comprehensive insights into your team's communication patterns, 
              collaboration efficiency, and engagement levels across all platforms.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Unified Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View all communication data in one place with cross-platform insights
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Team Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Understand collaboration patterns and team engagement levels
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">AI Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Get intelligent suggestions to improve team communication
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationIntegrationPage;
