import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { analytics } from './mockAnalytics';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

const generateToken = () => `nexus_pat_${[...Array(32)].map(() => Math.random().toString(36)[2]).join('')}`;

const AdvancedSettings: React.FC = () => {
  const [tokens, setTokens] = useState<ApiToken[]>([
    { id: '1', name: 'My First Token', token: generateToken(), createdAt: new Date().toLocaleDateString() },
  ]);
  const [newTokenName, setNewTokenName] = useState('');
  const [showToken, setShowToken] = useState<string | null>(null);

  const handleGenerateToken = () => {
    if (!newTokenName) return;
    const newToken: ApiToken = {
      id: (tokens.length + 1).toString(),
      name: newTokenName,
      token: generateToken(),
      createdAt: new Date().toLocaleDateString(),
    };
    setTokens([...tokens, newToken]);
    setNewTokenName('');
    analytics.track('api_token_generated', { token_name: newTokenName });
  };

  const handleRevokeToken = (id: string) => {
    const token = tokens.find(t => t.id === id);
    setTokens(tokens.filter((t) => t.id !== id));
    if (token) {
        analytics.track('api_token_revoked', { token_name: token.name });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    analytics.track('api_token_copied');
    // In a real app, you'd show a toast notification here
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Tokens</CardTitle>
          <CardDescription>
            Manage your personal access tokens for the Nexus API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-semibold">Generate New Token</h4>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Token Name (e.g., 'My CI/CD Script')"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
              />
              <Button onClick={handleGenerateToken} disabled={!newTokenName}>
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tokens.map((token) => (
              <div key={token.id} className="p-4 border rounded-md flex items-center justify-between">
                <div>
                  <p className="font-semibold">{token.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Created on {token.createdAt}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      readOnly
                      type={showToken === token.id ? 'text' : 'password'}
                      value={token.token}
                      className="font-mono"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowToken(showToken === token.id ? null : token.id)}>
                      {showToken === token.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(token.token)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="destructive" size="icon" onClick={() => handleRevokeToken(token.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {tokens.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                You don't have any active API tokens.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedSettings; 