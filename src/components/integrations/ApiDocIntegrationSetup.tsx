import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AlertCircle, Check, ChevronRight, FileUp, DownloadCloud, Globe, Key, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

// Import HubSpot integration as an example
import { hubspotIntegration } from '../../lib/integrations/hubspotIntegration';

// Types for API Documentation Integration
interface ApiDocIntegrationSetupProps {
  onIntegrationCreated?: (integration: any) => void;
}

interface IntegrationEndpoint {
  name: string;
  path: string;
  method: string;
  description: string;
}

interface IntegrationPattern {
  name: string;
  description: string;
  endpoints: IntegrationEndpoint[];
}

interface ApiDocAnalysisResult {
  title: string;
  version: string;
  serverUrl: string;
  authMethods: string[];
  endpointCount: number;
  patterns: IntegrationPattern[];
}

const ApiDocIntegrationSetup: React.FC<ApiDocIntegrationSetupProps> = ({ onIntegrationCreated }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [apiDoc, setApiDoc] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<ApiDocAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [integrationName, setIntegrationName] = useState<string>('');
  const [integrationConfig, setIntegrationConfig] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setApiDoc(content);
        setError(null);
      } catch (err) {
        setError('Failed to read the file. Please make sure it is a valid JSON or YAML file.');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file. Please try again.');
    };
    
    reader.readAsText(file);
  };
  
  // Fetch API documentation from URL
  const fetchApiDoc = async () => {
    if (!apiUrl) {
      setError('Please enter a valid API documentation URL');
      return;
    }
    
    setError(null);
    
    try {
      // In a real implementation, we would proxy this request through a backend service
      // For demo purposes, we'll simulate a successful response
      setIsAnalyzing(true);
      setAnalysisProgress(30);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo, we'll use a mock HubSpot OpenAPI doc
      const mockHubSpotOpenApi = JSON.parse(hubspotIntegration.getMockHubSpotOpenAPI());
      setApiDoc(JSON.stringify(mockHubSpotOpenApi, null, 2));
      setAnalysisProgress(100);
      
      // Proceed to analysis after a brief delay
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep(2);
      }, 500);
      
    } catch (err) {
      setError('Failed to fetch API documentation. Please check the URL and try again.');
      setIsAnalyzing(false);
    }
  };
  
  // Analyze API documentation
  const analyzeApiDoc = async () => {
    if (!apiDoc) {
      setError('No API documentation provided');
      return;
    }
    
    setError(null);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Start analysis animation
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // In a real implementation, we would use the apiDocAnalyzer service
      // For demo purposes, we'll simulate the analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Parse API doc to extract basic info
      const docObj = typeof apiDoc === 'string' ? JSON.parse(apiDoc) : apiDoc;
      const mockResult: ApiDocAnalysisResult = {
        title: docObj.info?.title || 'Untitled API',
        version: docObj.info?.version || '1.0.0',
        serverUrl: docObj.servers?.[0]?.url || 'https://api.example.com',
        authMethods: ['oauth2', 'apiKey'],
        endpointCount: Object.keys(docObj.paths || {}).length,
        patterns: [
          {
            name: 'Contacts Management',
            description: 'Manage contact records with full CRUD operations',
            endpoints: [
              { name: 'Get Contacts', path: '/crm/v3/objects/contacts', method: 'GET', description: 'Get a list of contacts' },
              { name: 'Create Contact', path: '/crm/v3/objects/contacts', method: 'POST', description: 'Create a new contact' },
              { name: 'Update Contact', path: '/crm/v3/objects/contacts/{contactId}', method: 'PATCH', description: 'Update a specific contact' }
            ]
          },
          {
            name: 'Companies Management',
            description: 'Manage company records with full CRUD operations',
            endpoints: [
              { name: 'Get Companies', path: '/crm/v3/objects/companies', method: 'GET', description: 'Get a list of companies' },
              { name: 'Create Company', path: '/crm/v3/objects/companies', method: 'POST', description: 'Create a new company' }
            ]
          },
          {
            name: 'Deals Management',
            description: 'Manage deal records with full CRUD operations',
            endpoints: [
              { name: 'Get Deals', path: '/crm/v3/objects/deals', method: 'GET', description: 'Get a list of deals' },
              { name: 'Create Deal', path: '/crm/v3/objects/deals', method: 'POST', description: 'Create a new deal' }
            ]
          }
        ]
      };
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      // Set the results
      setAnalysisResult(mockResult);
      setIntegrationName(mockResult.title);
      
      // Proceed to next step after a brief delay
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep(3);
      }, 500);
      
    } catch (err) {
      setError('Failed to analyze API documentation. Please check the format and try again.');
      setIsAnalyzing(false);
    }
  };
  
  // Generate integration code
  const generateIntegration = async () => {
    if (!analysisResult) {
      setError('No analysis result available');
      return;
    }
    
    if (!integrationName.trim()) {
      setError('Please provide a name for the integration');
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Start generation animation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // In a real implementation, we would use the actual code generation
      // For demo purposes, we'll simulate the generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      // Simulate integration creation
      const integration = {
        id: `${integrationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        name: integrationName,
        config: integrationConfig,
        patterns: analysisResult.patterns
      };
      
      // Notify parent component of the new integration
      if (onIntegrationCreated) {
        onIntegrationCreated(integration);
      }
      
      // Proceed to next step after a brief delay
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStep(4);
      }, 500);
      
    } catch (err) {
      setError('Failed to generate integration code. Please try again.');
      setIsGenerating(false);
    }
  };
  
  // Handle configuration changes
  const handleConfigChange = (key: string, value: string) => {
    setIntegrationConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Render different steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Upload API Documentation</CardTitle>
              <CardDescription>
                Provide your API documentation in OpenAPI/Swagger format to automatically generate an integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                  <TabsTrigger value="url">Fetch from URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                  <div className="grid gap-4">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <FileUp className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        {uploadedFileName ? 
                          `Selected: ${uploadedFileName}` : 
                          'Click to select or drag and drop your OpenAPI/Swagger file'}
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json,.yaml,.yml"
                        onChange={handleFileUpload}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={analyzeApiDoc} disabled={!apiDoc || isAnalyzing}>
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Documentation'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="url" className="mt-6">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="api-url">API Documentation URL</Label>
                      <div className="flex items-center space-x-2 mt-1.5">
                        <Input
                          id="api-url"
                          placeholder="https://example.com/api-docs.json"
                          value={apiUrl}
                          onChange={(e) => setApiUrl(e.target.value)}
                        />
                        <Button onClick={fetchApiDoc} disabled={!apiUrl || isAnalyzing}>
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Fetch
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Enter the URL of your OpenAPI/Swagger documentation.
                      </p>
                    </div>
                    {isAnalyzing && (
                      <div className="mt-4">
                        <Label className="text-sm">Fetching documentation...</Label>
                        <Progress value={analysisProgress} className="mt-2" />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Analyze API Documentation</CardTitle>
              <CardDescription>
                Let Nexus analyze your API documentation to identify integration patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAnalyzing ? (
                <div>
                  <Label className="text-sm">Analyzing API documentation...</Label>
                  <Progress value={analysisProgress} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-4">
                    This may take a moment as we process your API documentation to identify patterns and generate integration code.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="grid gap-4 mb-4">
                    <div>
                      <Label htmlFor="api-preview">API Documentation Preview</Label>
                      <ScrollArea className="h-64 w-full border rounded-md p-4 mt-1.5">
                        <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                          {apiDoc}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Back
                    </Button>
                    <Button onClick={analyzeApiDoc} disabled={!apiDoc || isAnalyzing}>
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Documentation'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 3:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Configure Integration</CardTitle>
              <CardDescription>
                Review the analysis results and configure your integration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analysisResult && (
                <div className="grid gap-6">
                  <div className="grid gap-4 mb-4">
                    <div>
                      <Label htmlFor="integration-name">Integration Name</Label>
                      <Input
                        id="integration-name"
                        value={integrationName}
                        onChange={(e) => setIntegrationName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Analysis Summary</Label>
                      <div className="mt-1.5 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">API Information</p>
                          <p className="text-sm text-muted-foreground">Version: {analysisResult.version}</p>
                          <p className="text-sm text-muted-foreground">Endpoints: {analysisResult.endpointCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Authentication</p>
                          <div className="flex flex-wrap gap-1">
                            {analysisResult.authMethods.map((method) => (
                              <Badge key={method} variant="outline">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>Integration Patterns</Label>
                      <div className="mt-1.5 space-y-3">
                        {analysisResult.patterns.map((pattern, idx) => (
                          <div key={idx} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium">{pattern.name}</p>
                                <p className="text-sm text-muted-foreground">{pattern.description}</p>
                              </div>
                              <Badge variant="secondary">{pattern.endpoints.length} endpoints</Badge>
                            </div>
                            <ScrollArea className="h-32 mt-2">
                              <div className="space-y-2">
                                {pattern.endpoints.map((endpoint, eidx) => (
                                  <div key={eidx} className="text-xs border-l-2 border-muted pl-2 py-1">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {endpoint.method}
                                      </Badge>
                                      <code className="text-xs">{endpoint.path}</code>
                                    </div>
                                    <p className="text-muted-foreground mt-1">{endpoint.description}</p>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Authentication Configuration</Label>
                      <div className="mt-1.5 space-y-3">
                        {analysisResult.authMethods.includes('apiKey') && (
                          <div className="border rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">API Key Authentication</p>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <Label htmlFor="api-key" className="text-xs">API Key</Label>
                                <Input
                                  id="api-key"
                                  placeholder="Enter your API key"
                                  value={integrationConfig.apiKey || ''}
                                  onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {analysisResult.authMethods.includes('oauth2') && (
                          <div className="border rounded-md p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Lock className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm font-medium">OAuth 2.0 Authentication</p>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <Label htmlFor="client-id" className="text-xs">Client ID</Label>
                                <Input
                                  id="client-id"
                                  placeholder="Enter your client ID"
                                  value={integrationConfig.clientId || ''}
                                  onChange={(e) => handleConfigChange('clientId', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="client-secret" className="text-xs">Client Secret</Label>
                                <Input
                                  id="client-secret"
                                  type="password"
                                  placeholder="Enter your client secret"
                                  value={integrationConfig.clientSecret || ''}
                                  onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="redirect-uri" className="text-xs">Redirect URI</Label>
                                <Input
                                  id="redirect-uri"
                                  placeholder="https://your-app.com/oauth/callback"
                                  value={integrationConfig.redirectUri || ''}
                                  onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Server Configuration</Label>
                      <div className="mt-1.5 border rounded-md p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">API Server</p>
                        </div>
                        <div>
                          <Label htmlFor="base-url" className="text-xs">Base URL</Label>
                          <Input
                            id="base-url"
                            placeholder="API base URL"
                            value={integrationConfig.baseUrl || analysisResult.serverUrl}
                            onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button onClick={generateIntegration} disabled={!integrationName || isGenerating}>
                      {isGenerating ? 'Generating...' : 'Generate Integration'}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      
      case 4:
        return (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Integration Complete</CardTitle>
              <CardDescription>
                Your integration has been successfully created and is ready to use.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{integrationName} Integration Created</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
                  Your integration has been created and is ready to use. You can now use it to connect with {integrationName} from within Nexus.
                </p>
                <div className="w-full max-w-md border rounded-md p-4 bg-muted/20">
                  <h4 className="text-sm font-medium mb-2">Integration Details</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {integrationName}</p>
                    <p><span className="font-medium">Authentication:</span> {analysisResult?.authMethods.join(', ')}</p>
                    <p><span className="font-medium">Patterns:</span> {analysisResult?.patterns.length}</p>
                    <p><span className="font-medium">Endpoints:</span> {analysisResult?.endpointCount}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => {
                // Reset state for a new integration
                setCurrentStep(1);
                setApiDoc('');
                setUploadedFileName('');
                setApiUrl('');
                setAnalysisResult(null);
                setIntegrationName('');
                setIntegrationConfig({});
                setActiveTab('upload');
              }}>
                Create Another Integration
              </Button>
              <Button>
                Go to Integrations Dashboard
              </Button>
            </CardFooter>
          </Card>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="flex flex-col items-center space-y-6 max-w-3xl mx-auto">
      <div className="w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">API Documentation Integration</h2>
          <p className="text-muted-foreground">
            Connect Nexus to any API by providing API documentation. Our AI will analyze the API structure and generate a custom integration.
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium
                    ${currentStep === step ? 'bg-primary text-white' : 
                      currentStep > step ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`
                  }
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                <span className="text-xs mt-2 text-center">
                  {step === 1 && 'Upload'}
                  {step === 2 && 'Analyze'}
                  {step === 3 && 'Configure'}
                  {step === 4 && 'Complete'}
                </span>
              </div>
            ))}
            <div className="absolute top-5 left-0 w-full h-[2px] bg-muted -z-0">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep - 1) * 33.33}%` }}
              />
            </div>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
};

export default ApiDocIntegrationSetup; 