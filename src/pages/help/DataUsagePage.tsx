import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { 
  Database, 
  Brain, 
  Shield, 
  Zap, 
  Eye, 
  Lock,
  UserCheck,
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const DataUsagePage: React.FC = () => {
  const dataUsagePrinciples = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: 'AI Enhancement Only',
      description: 'Your data is used exclusively to provide personalized AI insights and improve your business intelligence.'
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Never Sold or Shared',
      description: 'We never sell your business data to third parties or use it for advertising purposes.'
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      title: 'Your Consent Required',
      description: 'We only process data with your explicit consent and for the purposes you agree to.'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure Processing',
      description: 'All data processing happens in secure, encrypted environments with strict access controls.'
    }
  ];

  const dataProcessingTypes = [
    {
      category: 'Business Intelligence',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Analyze your business metrics and KPIs',
      dataTypes: ['Revenue and financial data', 'Customer interaction records', 'Operational metrics', 'Performance indicators'],
      purpose: 'Generate personalized business insights and recommendations',
      retention: '5 years or until account deletion'
    },
    {
      category: 'AI Personalization',
      icon: <Brain className="h-5 w-5" />,
      description: 'Customize AI responses to your business context',
      dataTypes: ['Chat conversation history', 'User preferences and settings', 'Feature usage patterns', 'Business context data'],
      purpose: 'Provide relevant, context-aware AI assistance',
      retention: '2 years or until account deletion'
    },
    {
      category: 'Integration Data',
      icon: <Zap className="h-5 w-5" />,
      description: 'Process data from connected business tools',
      dataTypes: ['Email and calendar data', 'CRM contact information', 'Financial transaction data', 'Document content'],
      purpose: 'Enable cross-platform business intelligence',
      retention: 'Active during integration + 90 days'
    },
    {
      category: 'Service Analytics',
      icon: <Eye className="h-5 w-5" />,
      description: 'Improve platform performance and features',
      dataTypes: ['Error logs and diagnostics', 'Performance metrics', 'Feature usage statistics', 'User feedback'],
      purpose: 'Enhance service quality and user experience',
      retention: '1 year for optimization analysis'
    }
  ];

  const dataRights = [
    {
      right: 'Access Your Data',
      description: 'Request a complete copy of all data we have about you',
      action: 'Available in Account Settings → Data Export'
    },
    {
      right: 'Correct Information',
      description: 'Update or fix any incorrect personal or business information',
      action: 'Editable in Profile Settings and integration configs'
    },
    {
      right: 'Delete Your Data',
      description: 'Request permanent deletion of your account and all associated data',
      action: 'Account Settings → Delete Account'
    },
    {
      right: 'Restrict Processing',
      description: 'Limit how we use specific types of your data',
      action: 'Privacy Settings → Data Processing Controls'
    },
    {
      right: 'Data Portability',
      description: 'Export your data in machine-readable formats',
      action: 'Available in JSON, CSV, and API formats'
    },
    {
      right: 'Withdraw Consent',
      description: 'Revoke permission for specific data processing activities',
      action: 'Privacy Settings → Consent Management'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Data Usage Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          This policy explains exactly how Nexus uses your business data to provide AI-powered insights while maintaining your privacy and control.
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Transparent Processing
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Shield className="h-3 w-3 mr-1" />
            Never Sold
          </Badge>
          <Badge variant="secondary" className="bg-secondary/10 text-purple-800">
            <UserCheck className="h-3 w-3 mr-1" />
            Your Control
          </Badge>
        </div>
      </div>

      {/* Core Principles */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Our Data Usage Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataUsagePrinciples.map((principle, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    {principle.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{principle.title}</h3>
                    <p className="text-sm text-muted-foreground">{principle.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* How We Use Your Data */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">How We Use Your Data</h2>
        <div className="space-y-6">
          {dataProcessingTypes.map((type, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary/10 text-primary">
                    {type.icon}
                  </div>
                  {type.category}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Data Types Processed:</h4>
                    <ul className="space-y-1">
                      {type.dataTypes.map((dataType, dtIndex) => (
                        <li key={dtIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {dataType}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Purpose:</h4>
                      <p className="text-sm text-muted-foreground">{type.purpose}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Retention Period:</h4>
                      <p className="text-sm text-muted-foreground">{type.retention}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* What We DON'T Do */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">What We DON'T Do With Your Data</h2>
        <Card className="border-red-200 bg-destructive/5/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <h3 className="font-semibold">Never Done</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-destructive" />
                    Sell your data to third parties
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-destructive" />
                    Use your data for advertising
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-destructive" />
                    Share with competitors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-destructive" />
                    Process without your consent
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-4 w-4" />
                  <h3 className="font-semibold">Always Done</h3>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-success" />
                    Encrypt all data in transit and at rest
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-success" />
                    Provide clear data controls
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-success" />
                    Respect deletion requests
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-success" />
                    Keep you informed of changes
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Your Data Rights */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Data Rights & Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataRights.map((right, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    {right.right}
                  </h3>
                  <p className="text-sm text-muted-foreground">{right.description}</p>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-primary">{right.action}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Data Processing Legal Basis */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Legal Basis for Processing</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Under GDPR and other privacy laws, we process your data based on the following legal grounds:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Contractual Necessity</h3>
                  <p className="text-sm text-muted-foreground">
                    Processing required to provide the Nexus service you've subscribed to
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Legitimate Interest</h3>
                  <p className="text-sm text-muted-foreground">
                    Service improvement, security, and fraud prevention activities
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Explicit Consent</h3>
                  <p className="text-sm text-muted-foreground">
                    Optional features and enhanced AI capabilities you choose to enable
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Legal Compliance</h3>
                  <p className="text-sm text-muted-foreground">
                    Required record-keeping and regulatory compliance obligations
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Questions About Data Usage?</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                If you have questions about how we use your data or want to exercise your rights:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Data Protection Officer</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: dpo@nexus.com<br />
                    For GDPR requests and data questions
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Privacy Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: privacy@nexus.com<br />
                    For general privacy inquiries
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 