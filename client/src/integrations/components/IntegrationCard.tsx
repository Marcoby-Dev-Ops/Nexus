import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import type { Integration } from '../types/integration';

interface IntegrationCardProps {
  integration: Integration;
  onConfigure?: (integration: Integration) => void;
  onTest?: (integration: Integration) => void;
  onDelete?: (integration: Integration) => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConfigure,
  onTest,
  onDelete,
}) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            {integration.name}
          </CardTitle>
          <Badge variant={integration.status === 'active' ? 'default' : 'secondary'}>
            {integration.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {integration.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Provider:</span>
            <span>{integration.provider}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Type:</span>
            <span>{integration.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium">Created:</span>
            <span>{new Date(integration.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {onConfigure && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onConfigure(integration)}
            >
              Configure
            </Button>
          )}
          {onTest && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onTest(integration)}
            >
              Test
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onDelete(integration)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
