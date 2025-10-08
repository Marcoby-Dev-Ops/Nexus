/**
 * Cloud Storage Setup Component for RAG Integration
 * Configures Google Drive and OneDrive document syncing for intelligent retrieval
 */

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FileText,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Progress,
  Switch,
  useToast,
} from '@/shared/components/ui';
import { googleDriveService } from '@/services/googleDriveService';
import { oneDriveService } from '@/services/oneDriveService';

interface CloudStorageSetupProps {
  onComplete?: () => void;
  onClose?: () => void;
}

interface SyncStatus {
  lastSync: string | null;
  totalDocuments: number;
  pendingSync: number;
  errors: string[];
}

interface StorageProvider {
  id: 'google-drive' | 'onedrive';
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  enabled: boolean;
  syncStatus: SyncStatus;
  service: any;
}

export function CloudStorageSetup({ onComplete, onClose }: CloudStorageSetupProps) {
  const [step, setStep] = useState<'overview' | 'configure' | 'sync' | 'complete'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResults, setSyncResults] = useState<any>(null);
  const { toast } = useToast();

  const [providers, setProviders] = useState<StorageProvider[]>([
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: <Cloud className="w-5 h-5" />,
      connected: false,
      enabled: false,
      syncStatus: { lastSync: null, totalDocuments: 0, pendingSync: 0, errors: [] },
      service: googleDriveService
    },
    {
      id: 'onedrive',
      name: 'OneDrive/SharePoint',
      icon: <Cloud className="w-5 h-5" />,
      connected: false,
      enabled: false,
      syncStatus: { lastSync: null, totalDocuments: 0, pendingSync: 0, errors: [] },
      service: oneDriveService
    }
  ]);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    const updatedProviders = await Promise.all(
      providers.map(async (provider) => {
        try {
          const connected = await provider.service.initialize();
          const syncStatus = connected ? await provider.service.getSyncStatus() : 
            { lastSync: null, totalDocuments: 0, pendingSync: 0, errors: [] };
          
          return {
            ...provider,
            connected,
            enabled: connected,
            syncStatus
          };
        } catch (error) {
           
     
    // eslint-disable-next-line no-console
    console.error(`Failed to check ${provider.name} status: `, error);
          return provider;
        }
      })
    );
    setProviders(updatedProviders);
  };

  const toggleProvider = async (providerId: string, enabled: boolean) => {
    if (!enabled) {
      // Just disable locally
      setProviders(prev => prev.map(p => 
        p.id === providerId ? { ...p, enabled: false } : p
      ));
      return;
    }

    // If enabling, check if connected
    const provider = providers.find(p => p.id === providerId);
    if (!provider?.connected) {
      toast({
        title: "Integration Required",
        description: `Please connect ${provider?.name} first in the Integrations page.`,
        variant: "destructive"
      });
      return;
    }

    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, enabled: true } : p
    ));
  };

  const syncDocuments = async () => {
    setStep('sync');
    setIsLoading(true);
    setSyncProgress(0);

    const enabledProviders = providers.filter(p => p.enabled);
    const results = [];

    for (let i = 0; i < enabledProviders.length; i++) {
      const provider = enabledProviders[i];
      
      try {
        toast({
          title: "Syncing Documents",
          description: `Processing ${provider.name} documents...`,
        });

        const result = await provider.service.triggerSync();
        results.push({ provider: provider.name, ...result });
        
        setSyncProgress(((i + 1) / enabledProviders.length) * 100);
        
        // Update provider status
        const updatedStatus = await provider.service.getSyncStatus();
        setProviders(prev => prev.map(p => 
          p.id === provider.id ? { ...p, syncStatus: updatedStatus } : p
        ));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message: 'An unknown error occurred';
         
     
    // eslint-disable-next-line no-console
    console.error(`Failed to sync ${provider.name}:`, error);
        results.push({ 
          provider: provider.name, 
          success: false, 
          processed: 0, 
          errors: [errorMessage] 
        });
        toast({
          title: `Sync Error: ${provider.name}`,
          description: errorMessage,
          variant: 'destructive'
        });
      }
    }

    setSyncResults(results);
    setIsLoading(false);
    setStep('complete');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Cloud Storage RAG Integration</h3>
          <p className="text-muted-foreground mt-2">
            Connect your cloud storage to make documents searchable by Nexus AI.
            Your files become intelligent business context.
          </p>
        </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What This Enables: </h4>
        <ul className="text-sm text-primary space-y-1">
          <li>• AI can reference your meeting notes, project docs, and spreadsheets</li>
          <li>• "Based on last week's board meeting..." type responses</li>
          <li>• Intelligent search across all your business documents</li>
          <li>• Contextual insights from your actual company data</li>
        </ul>
      </div>

      <Button onClick={() => setStep('configure')} className="w-full">
        Configure Document Sync
      </Button>
    </div>
  );

  const renderConfigure = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Storage Providers</h3>
        <p className="text-muted-foreground mb-6">
          Choose which cloud storage services to sync for AI document retrieval.
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <Card key={provider.id} className="border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {provider.icon}
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {provider.connected ? (
                        <span className="flex items-center text-success">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Connected • {provider.syncStatus.totalDocuments} documents
                        </span>
                      ) : (
                        <span className="flex items-center text-warning">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Not connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {provider.syncStatus.lastSync && (
                    <div className="text-xs text-muted-foreground">
                      Last sync: {new Date(provider.syncStatus.lastSync).toLocaleDateString()}
                    </div>
                  )}
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked: boolean) => toggleProvider(provider.id, checked)}
                    disabled={!provider.connected}
                  />
                </div>
              </div>
              
              {provider.syncStatus.errors.length > 0 && (
                <div className="mt-3 p-2 bg-destructive/5 rounded text-sm text-destructive">
                  <strong>Sync Errors: </strong>
                  <ul className="mt-1 space-y-1">
                    {provider.syncStatus.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-amber-50 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <Eye className="w-5 h-5 text-warning mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Privacy Note: </strong> Documents are processed locally and stored securely. 
            Only text content is extracted for AI context - original files remain in your cloud storage.
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <Button variant="outline" onClick={() => setStep('overview')} className="flex-1">
          Back
        </Button>
        <Button 
          onClick={syncDocuments} 
          disabled={!providers.some(p => p.enabled)}
          className="flex-1"
        >
          Start Document Sync
        </Button>
      </div>
    </div>
  );

  const renderSync = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className={`w-8 h-8 text-primary ${isLoading ? 'animate-spin' : ''}`} />
        </div>
        <h3 className="text-lg font-semibold">Syncing Documents</h3>
        <p className="text-muted-foreground">
          Processing your documents for AI retrieval...
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Sync Progress</span>
            <span>{Math.round(syncProgress)}%</span>
          </div>
          <Progress value={syncProgress} className="h-2" />
        </div>

        <div className="space-y-2">
          {providers.filter(p => p.enabled).map((provider) => (
            <div key={provider.id} className="flex items-center justify-between p-4 bg-background rounded">
              <div className="flex items-center space-x-2">
                {provider.icon}
                <span className="font-medium">{provider.name}</span>
              </div>
              <Badge variant="secondary">Processing...</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Document Sync Complete!</h3>
        <p className="text-muted-foreground">
          Your documents are now available for AI-powered insights.
        </p>
      </div>

      {syncResults && (
        <div className="space-y-4">
          <h4 className="font-medium">Sync Results: </h4>
          {syncResults.map((result: any, index: number) => (
            <Card key={index} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{result.provider}</div>
                    <div className="text-sm text-muted-foreground">
                      {result.success ? (
                        `✅ Processed ${result.processed} documents`
                      ) : (
                        `❌ Sync failed`
                      )}
                    </div>
                  </div>
                  {result.success && (
                    <Badge variant="secondary">{result.processed} docs</Badge>
                  )}
                </div>
                
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 text-sm text-destructive">
                    <strong>Errors: </strong>
                    <ul className="mt-1 space-y-1">
                      {result.errors.map((error: string, i: number) => (
                        <li key={i}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="bg-success/5 p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <Zap className="w-5 h-5 text-success mt-0.5" />
          <div className="text-sm text-success">
            <strong>What's Next: </strong> Your AI assistants can now reference your documents. 
            Try asking "What did we discuss in last week's meeting?" or "Show me our Q4 budget."
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Close
        </Button>
        <Button onClick={onComplete} className="flex-1">
          Start Using AI
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Cloud Storage Integration</h2>
          <Badge variant="secondary">RAG Setup</Badge>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center space-x-2 mb-6">
          {['Overview', 'Configure', 'Sync', 'Complete'].map((stepName, index) => {
            const stepIndex = ['overview', 'configure', 'sync', 'complete'].indexOf(step);
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;
            
            return (
              <React.Fragment key={stepName}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-green-600 text-primary-foreground' :
                  'bg-gray-200 text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < 3 && (
                  <div className={`h-1 w-8 ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {step === 'overview' && renderOverview()}
          {step === 'configure' && renderConfigure()}
          {step === 'sync' && renderSync()}
          {step === 'complete' && renderComplete()}
        </CardContent>
      </Card>
    </div>
  );
} 
