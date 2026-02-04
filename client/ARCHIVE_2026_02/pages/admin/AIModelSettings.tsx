import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Switch } from '@/shared/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Separator } from '@/shared/components/ui/Separator';
import { Bot, Key, Settings, Zap } from 'lucide-react';

const AIModelSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">AI Model Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure AI models, API keys, and model preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* OpenAI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              OpenAI Configuration
            </CardTitle>
            <CardDescription>
              Configure your OpenAI API settings and model preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="sk-..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="openai-model">Default Model</Label>
              <Select defaultValue="gpt-4">
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="openai-temperature">Temperature</Label>
              <Input
                id="openai-temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                defaultValue="0.7"
              />
            </div>
            
            <Button variant="outline">Test Connection</Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Anthropic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Anthropic Configuration
            </CardTitle>
            <CardDescription>
              Configure your Anthropic Claude API settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <Input
                id="anthropic-key"
                type="password"
                placeholder="sk-ant-..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="anthropic-model">Default Model</Label>
              <Select defaultValue="claude-3-sonnet">
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline">Test Connection</Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Model Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Model Preferences
            </CardTitle>
            <CardDescription>
              Configure default model settings and fallbacks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-provider">Primary AI Provider</Label>
              <Select defaultValue="openai">
                <SelectTrigger>
                  <SelectValue placeholder="Select primary provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fallback-provider">Fallback Provider</Label>
              <Select defaultValue="anthropic">
                <SelectTrigger>
                  <SelectValue placeholder="Select fallback provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-fallback">Auto Fallback</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically switch to fallback provider on errors
                </p>
              </div>
              <Switch id="auto-fallback" defaultChecked />
            </div>
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
              Configure AI performance and optimization settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                min="1"
                max="4000"
                defaultValue="1000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeout">Request Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="10"
                max="300"
                defaultValue="60"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="streaming">Enable Streaming</Label>
                <p className="text-sm text-muted-foreground">
                  Stream AI responses for better user experience
                </p>
              </div>
              <Switch id="streaming" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="caching">Enable Response Caching</Label>
                <p className="text-sm text-muted-foreground">
                  Cache AI responses to improve performance
                </p>
              </div>
              <Switch id="caching" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2">
          <Button variant="outline">Reset to Defaults</Button>
          <Button>Save Settings</Button>
        </div>
      </div>
    </div>
  );
};

export default AIModelSettings; 
