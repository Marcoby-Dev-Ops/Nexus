import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';

// Mock analytics until a global service is available
const analytics = {
  track: (event: string, data?: any) => {
    console.log(`[Analytics] ${event}`, data);
  },
};

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
}

const initialIntegrations: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive notifications and alerts in your Slack workspace.',
    connected: false,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Connect your GitHub repositories to sync issues and PRs.',
    connected: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync your Nexus tasks with your Jira projects.',
    connected: false,
  },
];

const IntegrationsSettings: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);

  const handleToggleConnection = (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    if (!integration) return;

    setIntegrations(
      integrations.map((i) =>
        i.id === id
          ? { ...i, connected: !i.connected }
          : i
      )
    );
    
    analytics.track('integration_connection_toggled', {
      integration_id: id,
      connected: !integration.connected,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Apps</CardTitle>
          <CardDescription>
            Manage your connected applications and integrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration, index) => (
              <React.Fragment key={integration.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Placeholder for app icon */}
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center font-bold">
                      {integration.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{integration.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={integration.connected ? 'destructive' : 'default'}
                    onClick={() => handleToggleConnection(integration.id)}
                  >
                    {integration.connected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>
                {index < integrations.length - 1 && <Separator />}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsSettings; 