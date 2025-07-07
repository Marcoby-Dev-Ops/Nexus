import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Shield, Lock, Eye, Database, UserCheck, FileText } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const privacyPrinciples = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Data Protection First',
      description: 'Your business data is encrypted at rest and in transit using industry-standard AES-256 encryption.'
    },
    {
      icon: <UserCheck className="h-5 w-5" />,
      title: 'Your Data, Your Control',
      description: 'You own your data. You can export, modify, or delete your information at any time.'
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: 'Transparent Processing',
      description: 'We clearly explain what data we collect, how we use it, and who we share it with.'
    },
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'Minimal Data Collection',
      description: 'We only collect data necessary to provide and improve our services.'
    }
  ];

  const dataTypes = [
    {
      category: 'Account Information',
      items: ['Name, email address, company name', 'Profile photo and job title', 'Account preferences and settings'],
      purpose: 'To create and manage your Nexus account'
    },
    {
      category: 'Business Data',
      items: ['Connected integration data (emails, CRM records, financial data)', 'Custom KPIs and metrics you define', 'Workflow and automation configurations'],
      purpose: 'To provide AI insights and business intelligence'
    },
    {
      category: 'Usage Analytics',
      items: ['Feature usage patterns', 'Performance metrics', 'Error logs and diagnostics'],
      purpose: 'To improve service quality and user experience'
    },
    {
      category: 'Communication Data',
      items: ['AI chat conversations', 'Support tickets and interactions', 'Feedback and feature requests'],
      purpose: 'To provide personalized AI assistance and support'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: December 2024</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          At Nexus, we believe that privacy is a fundamental right. This policy explains how we collect, use, and protect your personal and business information.
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-success/10 text-success">
            <Lock className="h-3 w-3 mr-1" />
            GDPR Compliant
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Shield className="h-3 w-3 mr-1" />
            SOC 2 Type II
          </Badge>
          <Badge variant="secondary" className="bg-secondary/10 text-purple-800">
            <Database className="h-3 w-3 mr-1" />
            Data Encrypted
          </Badge>
        </div>
      </div>

      {/* Privacy Principles */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Our Privacy Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {privacyPrinciples.map((principle, index) => (
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

      {/* Data We Collect */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
        <div className="space-y-4">
          {dataTypes.map((dataType, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  {dataType.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">What we collect:</h4>
                    <ul className="space-y-1">
                      {dataType.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t">
                    <h4 className="font-medium mb-1">Purpose:</h4>
                    <p className="text-sm text-muted-foreground">{dataType.purpose}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* How We Use Data */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Service Delivery
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Provide AI-powered business insights</li>
                  <li>• Process and analyze your business data</li>
                  <li>• Deliver personalized recommendations</li>
                  <li>• Maintain and improve service performance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Account Management
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Authenticate and authorize access</li>
                  <li>• Provide customer support</li>
                  <li>• Send important service updates</li>
                  <li>• Process billing and payments</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Your Rights */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Privacy Rights</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Access & Portability</h3>
                  <p className="text-sm text-muted-foreground">Request a copy of your personal data in a portable format</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Correction</h3>
                  <p className="text-sm text-muted-foreground">Update or correct inaccurate personal information</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Deletion</h3>
                  <p className="text-sm text-muted-foreground">Request deletion of your personal data and account</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2">Restriction</h3>
                  <p className="text-sm text-muted-foreground">Limit how we process your personal information</p>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  To exercise any of these rights, please contact us at{' '}
                  <span className="font-medium text-primary">privacy@nexus.com</span> or visit your{' '}
                  <span className="font-medium">Account Settings</span>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Privacy Officer</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: privacy@nexus.com<br />
                    Response time: Within 48 hours
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Data Protection</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: dpo@nexus.com<br />
                    For GDPR and compliance inquiries
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