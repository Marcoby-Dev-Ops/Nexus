import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Separator } from '@/shared/components/ui/Separator';
import { Settings, Database, Code, Zap } from 'lucide-react';

const AdvancedSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Advanced Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure advanced options for power users and developers.
        </p>
      </div>

      <div className="space-y-4">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure API endpoints and authentication settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">API Base URL</Label>
              <Input
                id="api-url"
                placeholder="https://api.nexus.com"
                defaultValue="https://api.nexus.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
              />
            </div>
            <Button variant="outline">Test Connection</Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Configuration
            </CardTitle>
            <CardDescription>
              Advanced database and caching settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cache-ttl">Cache TTL (seconds)</Label>
              <Input
                id="cache-ttl"
                type="number"
                defaultValue="3600"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-connections">Max Database Connections</Label>
              <Input
                id="max-connections"
                type="number"
                defaultValue="10"
                min="1"
                max="100"
              />
            </div>
            <Button variant="outline">Reset to Defaults</Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Performance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Settings
            </CardTitle>
            <CardDescription>
              Optimize application performance and resource usage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch Processing Size</Label>
              <Input
                id="batch-size"
                type="number"
                defaultValue="100"
                min="10"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                defaultValue="30000"
                min="1000"
                max="300000"
              />
            </div>
            <Button variant="outline">Apply Settings</Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Debug Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Debug & Logging
            </CardTitle>
            <CardDescription>
              Configure debug logging and error reporting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="log-level">Log Level</Label>
              <select
                id="log-level"
                className="w-full px-3 py-2 border border-input rounded-md"
                defaultValue="info"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="debug-info">Debug Information</Label>
              <Textarea
                id="debug-info"
                placeholder="Additional debug information..."
                rows={3}
              />
            </div>
            <Button variant="outline">Export Logs</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedSettings; 
