/**
 * Data Source Connections Component
 * Shows available integrations and allows users to connect data sources
 * to improve their business health score
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { 
  CheckCircle, 
  Circle, 
  Shield, 
  TrendingUp, 
  Link, 
  AlertTriangle, 
  Star 
} from 'lucide-react';
import { useDataConnectivityHealth } from '@/hooks/dashboard/useDataConnectivityHealth';

interface DataSourceConnectionsProps {
  className?: string;
}

const DataSourceConnections: React.FC<DataSourceConnectionsProps> = ({ 
  className = '' 
}) => {
  const { healthData, loading, refresh } = useDataConnectivityHealth();
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  const handleConnect = async (sourceId: string) => {
    setConnectingTo(sourceId);
    
    try {
      // Get the source details
      const allSources = [
        ...(((healthData as any)?.connectedSources) || []),
        ...(((healthData as any)?.unconnectedSources) || []),
      ];
      const source = allSources.find(s => s.id === sourceId);
      
      if (!source) {
        throw new Error('Source not found');
      }

      // Handle different connection types
      if (source.category === 'business_profile') {
        // Navigate to business profile setup
        window.location.href = '/admin/company-profile';
        return;
      }
      
      if (source.category === 'communications') {
        // Navigate to integrations page
        window.location.href = '/integrations';
        return;
      }
      
      if (source.category === 'sales') {
        // Navigate to sales integrations
        window.location.href = '/integrations/hubspot';
        return;
      }
      
      if (source.category === 'finance') {
        // Navigate to finance integrations
        window.location.href = '/integrations';
        return;
      }
      
      if (source.category === 'operations') {
        // Navigate to operations integrations
        window.location.href = '/integrations';
        return;
      }
      
      if (source.category === 'marketing') {
        // Navigate to marketing integrations
        window.location.href = '/integrations';
        return;
      }
      
      // Default: navigate to integrations page
      window.location.href = '/integrations';
      
    } catch (error) {
      console.error('Failed to connect: ', error);
    } finally {
      setConnectingTo(null);
    }
  };

  const getSourceIcon = (category: string) => {
    switch (category) {
      case 'business_profile':
        return <Shield className="w-5 h-5 text-primary" />;
      case 'communications':
        return <Circle className="w-5 h-5 text-success" />;
      case 'sales':
        return <TrendingUp className="w-5 h-5 text-secondary" />;
      case 'finance':
        return <Star className="w-5 h-5 text-warning" />;
      case 'operations':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <Link className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getConnectionStatus = (source: any) => {
    if (source.isConnected) {
      if (source.isVerified) {
        return { 
          icon: <CheckCircle className="w-4 h-4 text-success" />, 
          text: 'Connected & Verified', 
          color: 'text-success' 
        };
      } else {
        return { 
          icon: <Circle className="w-4 h-4 text-warning" />, 
          text: 'Connected', 
          color: 'text-warning' 
        };
      }
    } else {
      return { 
        icon: <Circle className="w-4 h-4 text-muted-foreground" />, 
        text: 'Not Connected', 
        color: 'text-muted-foreground' 
      };
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'business_profile':
        return 'Business Profile';
      case 'communications':
        return 'Communications';
      case 'sales':
        return 'Sales & CRM';
      case 'finance':
        return 'Finance & Payments';
      case 'operations':
        return 'Operations';
      case 'marketing':
        return 'Marketing & Analytics';
      default: return category;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading data sources...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group sources by category
  const allSources = [
    ...(((healthData as any)?.connectedSources) || []),
    ...(((healthData as any)?.unconnectedSources) || []),
  ];
  const sourcesByCategory = allSources.reduce((acc, source) => {
    if (!acc[source.category]) {
      acc[source.category] = [];
    }
    acc[source.category].push(source);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="w-5 h-5" />
          Connect Your Data Sources
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Connect and verify your business data sources to improve your business health score. 
          Verified connections get higher scores.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(sourcesByCategory).map(([category, sources]) => (
          <div key={category} className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {getCategoryTitle(category)}
            </h3>
            
            <div className="space-y-2">
              {sources.map((source) => {
                const status = getConnectionStatus(source);
                const isConnecting = connectingTo === source.id;
                
                return (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover: border-border transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getSourceIcon(source.category)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{source.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {source.pointsValue} pts
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {source.description}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        {status.icon}
                        <span className={status.color}>{status.text}</span>
                      </div>
                      
                      {source.isConnected ? (
                        <div className="flex items-center gap-2">
                          {source.accessLevel && (
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                            >
                              {source.accessLevel}
                            </Badge>
                          )}
                          {!source.isVerified && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConnect(source.id)}
                              disabled={isConnecting}
                            >
                              {isConnecting ? 'Verifying...' : 'Verify'}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleConnect(source.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting ? 'Connecting...' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {healthData?.recommendations && healthData.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-primary/5 dark: bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
              Recommendations to Improve Your Score
            </h4>
            <ul className="space-y-1 text-sm text-primary dark:text-blue-200">
              {healthData.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSourceConnections; 
