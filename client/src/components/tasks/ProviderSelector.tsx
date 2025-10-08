import React from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Mail, Shield } from 'lucide-react';
import type { EmailProvider } from '@/shared/types/email';

interface ProviderSelectorProps {
  selectedProvider: EmailProvider;
  onProviderChange: (provider: EmailProvider) => void;
  supportedProviders: EmailProvider[];
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  supportedProviders,
}) => {
  const providerConfigs = {
    microsoft: {
      name: 'Microsoft 365',
      icon: Mail,
      description: 'Enterprise email with advanced features',
      color: 'bg-blue-500',
    },
    gmail: {
      name: 'Gmail',
      icon: Mail,
      description: 'Google Workspace email',
      color: 'bg-red-500',
    },
    outlook: {
      name: 'Outlook.com',
      icon: Mail,
      description: 'Personal Microsoft email',
      color: 'bg-blue-600',
    },
    yahoo: {
      name: 'Yahoo Mail',
      icon: Mail,
      description: 'Yahoo email service',
      color: 'bg-purple-500',
    },
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Email Provider</h3>
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-3">
        {supportedProviders.map((provider) => {
          const config = providerConfigs[provider];
          const Icon = config.icon;
          const isSelected = selectedProvider === provider;

          return (
            <Button
              key={provider}
              variant={isSelected ? 'default' : 'outline'}
              className={`h-auto p-4 flex flex-col items-center gap-2 ${
                isSelected ? config.color: ''
              }`}
              onClick={() => onProviderChange(provider)}
            >
              <Icon className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">{config.name}</div>
                <div className="text-xs text-muted-foreground">
                  {config.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>All providers support compliance analysis and zero-data storage</span>
        </div>
      </div>
    </div>
  );
};

export default ProviderSelector; 
