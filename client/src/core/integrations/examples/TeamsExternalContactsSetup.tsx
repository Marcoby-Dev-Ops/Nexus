/**
 * Microsoft Teams External Contacts Setup Example
 * 
 * This example demonstrates how to set up Microsoft Teams for safe usage with external contacts,
 * following best practices for security, collaboration, and compliance.
 * 
 * Key Features:
 * - External guest access configuration
 * - Security policies and permissions
 * - Team structure recommendations
 * - Compliance and governance
 * - Best practices implementation
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Users, 
  Settings,
  Lock,
  Globe,
  UserPlus,
  FileText,
  Calendar,
  MessageSquare,
  Zap,
  Target,
  Clock,
  Star,
  Info,
  ExternalLink
} from 'lucide-react';
import { EnhancedIntegrationConnector } from '@/components/integrations/EnhancedIntegrationConnector';
import { insightsEngine } from '@/core/integrations/insights';
import { logger } from '@/shared/utils/logger';

interface ExternalContactSetup {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'client' | 'partner' | 'vendor' | 'consultant';
  accessLevel: 'guest' | 'member' | 'owner';
  teams: string[];
  permissions: string[];
  status: 'pending' | 'active' | 'expired' | 'revoked';
  addedDate: string;
  expiryDate?: string;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'access' | 'data' | 'communication' | 'compliance';
  enabled: boolean;
  settings: Record<string, any>;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  purpose: string;
  channels: string[];
  permissions: string[];
  guestAccess: boolean;
  externalSharing: boolean;
  compliance: string[];
}

export const TeamsExternalContactsSetup: React.FC = () => {
  const [externalContacts, setExternalContacts] = useState<ExternalContactSetup[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [teamTemplates, setTeamTemplates] = useState<TeamTemplate[]>([]);
  const [setupProgress, setSetupProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [setupComplete, setSetupComplete] = useState(false);

  // Initialize with example data
  useEffect(() => {
    initializeExampleData();
  }, []);

  const initializeExampleData = () => {
    // Example external contacts
    const contacts: ExternalContactSetup[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@clientcorp.com',
        organization: 'ClientCorp Inc.',
        role: 'client',
        accessLevel: 'guest',
        teams: ['Client Projects', 'Marketing Collaboration'],
        permissions: ['read', 'chat', 'meetings'],
        status: 'active',
        addedDate: '2024-01-15',
        expiryDate: '2024-12-31'
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike.chen@partnertech.com',
        organization: 'PartnerTech Solutions',
        role: 'partner',
        accessLevel: 'member',
        teams: ['Partner Integration', 'Technical Support'],
        permissions: ['read', 'write', 'chat', 'meetings', 'files'],
        status: 'active',
        addedDate: '2024-01-10'
      }
    ];

    // Example security policies
    const policies: SecurityPolicy[] = [
      {
        id: '1',
        name: 'Guest Access Control',
        description: 'Control who can invite guests and what they can access',
        category: 'access',
        enabled: true,
        settings: {
          allowGuestInvites: false,
          requireApproval: true,
          maxGuestsPerTeam: 10,
          guestExpiryDays: 90
        },
        impact: 'high'
      },
      {
        id: '2',
        name: 'External Sharing Restrictions',
        description: 'Limit external sharing of sensitive documents',
        category: 'data',
        enabled: true,
        settings: {
          allowExternalSharing: true,
          requireNDA: true,
          watermarkDocuments: true,
          trackAccess: true
        },
        impact: 'critical'
      },
      {
        id: '3',
        name: 'Communication Monitoring',
        description: 'Monitor external communications for compliance',
        category: 'communication',
        enabled: true,
        settings: {
          logAllMessages: true,
          flagSensitiveContent: true,
          requireApprovalForFiles: true
        },
        impact: 'medium'
      }
    ];

    // Example team templates
    const templates: TeamTemplate[] = [
      {
        id: '1',
        name: 'Client Collaboration',
        description: 'Template for client project collaboration',
        purpose: 'Secure collaboration with external clients',
        channels: ['General', 'Project Updates', 'Documents', 'Meetings'],
        permissions: ['read', 'chat', 'meetings'],
        guestAccess: true,
        externalSharing: true,
        compliance: ['NDA Required', 'Audit Trail', 'Access Review']
      },
      {
        id: '2',
        name: 'Partner Integration',
        description: 'Template for partner collaboration',
        purpose: 'Technical collaboration with partners',
        channels: ['General', 'Technical Discussion', 'API Integration', 'Support'],
        permissions: ['read', 'write', 'chat', 'meetings', 'files'],
        guestAccess: true,
        externalSharing: true,
        compliance: ['Partner Agreement', 'Data Protection', 'Regular Review']
      },
      {
        id: '3',
        name: 'Vendor Management',
        description: 'Template for vendor relationships',
        purpose: 'Manage vendor communications and deliverables',
        channels: ['General', 'Deliverables', 'Invoices', 'Support'],
        permissions: ['read', 'chat', 'meetings'],
        guestAccess: true,
        externalSharing: false,
        compliance: ['Vendor Agreement', 'Payment Terms', 'Performance Review']
      }
    ];

    setExternalContacts(contacts);
    setSecurityPolicies(policies);
    setTeamTemplates(templates);
  };

  const handleSetupStep = async (step: number) => {
    setCurrentStep(step);
    setSetupProgress((step / 5) * 100);

    // Simulate setup process
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (step === 5) {
      setSetupComplete(true);
      logger.info('Teams External Contacts Setup completed');
    }
  };

  const getSecurityIcon = (impact: string) => {
    switch (impact) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <Shield className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Lock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Active</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      case 'expired': return <Badge variant="destructive">Expired</Badge>;
      case 'revoked': return <Badge variant="destructive">Revoked</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return <Users className="h-4 w-4 text-blue-500" />;
      case 'partner': return <Globe className="h-4 w-4 text-green-500" />;
      case 'vendor': return <FileText className="h-4 w-4 text-purple-500" />;
      case 'consultant': return <MessageSquare className="h-4 w-4 text-orange-500" />;
      default: return <UserPlus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Teams External Contacts Setup</h1>
            <p className="text-gray-600">
              Secure collaboration with external contacts using Microsoft Teams best practices
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          Best Practice Example
        </Badge>
      </div>

      {/* Setup Progress */}
      {!setupComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Setup Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Step {currentStep} of 5</span>
                <span>{setupProgress}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div 
                    key={step}
                    className={`p-2 rounded text-center cursor-pointer transition-colors ${
                      step <= currentStep 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    onClick={() => handleSetupStep(step)}
                  >
                    {step === 1 && 'Security'}
                    {step === 2 && 'Templates'}
                    {step === 3 && 'Contacts'}
                    {step === 4 && 'Policies'}
                    {step === 5 && 'Review'}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Guest Access Control</div>
                      <div className="text-sm text-gray-600">
                        Limit guest invitations to authorized users only
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Regular Access Reviews</div>
                      <div className="text-sm text-gray-600">
                        Review and update external access quarterly
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Document Protection</div>
                      <div className="text-sm text-gray-600">
                        Use watermarks and access tracking for sensitive files
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Communication Monitoring</div>
                      <div className="text-sm text-gray-600">
                        Monitor external communications for compliance
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    'Enable guest access controls',
                    'Configure external sharing policies',
                    'Set up access expiration',
                    'Implement document protection',
                    'Enable audit logging',
                    'Create team templates',
                    'Define role-based permissions',
                    'Set up monitoring alerts'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => handleSetupStep(1)}
                  className="h-20 flex-col"
                  variant="outline"
                >
                  <Shield className="h-6 w-6 mb-2" />
                  <span className="text-sm">Configure Security</span>
                </Button>
                <Button 
                  onClick={() => handleSetupStep(2)}
                  className="h-20 flex-col"
                  variant="outline"
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="text-sm">Create Templates</span>
                </Button>
                <Button 
                  onClick={() => handleSetupStep(3)}
                  className="h-20 flex-col"
                  variant="outline"
                >
                  <UserPlus className="h-6 w-6 mb-2" />
                  <span className="text-sm">Add Contacts</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              These security policies help protect your organization while enabling safe collaboration with external contacts.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getSecurityIcon(policy.impact)}
                    {policy.name}
                    <Badge variant="outline" className="ml-auto">
                      {policy.impact}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{policy.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <div className="flex items-center gap-2">
                        {policy.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {policy.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Settings:</span>
                      {Object.entries(policy.settings).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Purpose:</span>
                      <p className="text-sm text-gray-600">{template.purpose}</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Channels:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.channels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium">Permissions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {template.guestAccess ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>Guest Access</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {template.externalSharing ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span>External Sharing</span>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="w-full">
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">External Contacts</h3>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="space-y-4">
            {externalContacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(contact.role)}
                      <div>
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-gray-600">{contact.email}</div>
                        <div className="text-xs text-gray-500">{contact.organization}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {contact.role}
                      </Badge>
                      {getStatusBadge(contact.status)}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Access Level:</span>
                      <div className="text-gray-600 capitalize">{contact.accessLevel}</div>
                    </div>
                    <div>
                      <span className="font-medium">Teams:</span>
                      <div className="text-gray-600">{contact.teams.length} teams</div>
                    </div>
                    <div>
                      <span className="font-medium">Added:</span>
                      <div className="text-gray-600">
                        {new Date(contact.addedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {contact.expiryDate && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Expires:</span>
                      <span className="text-gray-600 ml-2">
                        {new Date(contact.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This example demonstrates how to use the Nexus Integration SDK to implement Teams external contacts setup with best practices.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Microsoft 365 Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedIntegrationConnector
                connectorId="microsoft365"
                showInsights={true}
                showBestPractices={true}
                showJourneys={true}
                customTitle="Teams External Contacts Setup"
                customDescription="Configure secure external collaboration with best practices"
                customIcon={<Shield className="h-8 w-8 text-blue-500" />}
              />
            </CardContent>
          </Card>

          {/* Implementation Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Implementation Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Security Configuration</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                    {`// Configure guest access policies
const guestAccessPolicy = {
  allowGuestInvites: false,
  requireApproval: true,
  maxGuestsPerTeam: 10,
  guestExpiryDays: 90
};`}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Team Template Creation</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                    {`// Create team template for external collaboration
const clientTemplate = {
  name: 'Client Collaboration',
  channels: ['General', 'Project Updates', 'Documents'],
  permissions: ['read', 'chat', 'meetings'],
  guestAccess: true,
  compliance: ['NDA Required', 'Audit Trail']
};`}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. External Contact Management</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                    {`// Add external contact with proper permissions
const externalContact = {
  name: 'Sarah Johnson',
  email: 'sarah@clientcorp.com',
  role: 'client',
  accessLevel: 'guest',
  teams: ['Client Projects'],
  permissions: ['read', 'chat', 'meetings']
};`}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">4. Monitoring and Compliance</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono">
                    {`// Set up monitoring and compliance
const complianceSettings = {
  logAllMessages: true,
  flagSensitiveContent: true,
  requireApprovalForFiles: true,
  regularAccessReviews: true
};`}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Setup Complete */}
      {setupComplete && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Teams external contacts setup completed successfully! Your organization is now configured for secure external collaboration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TeamsExternalContactsSetup;
