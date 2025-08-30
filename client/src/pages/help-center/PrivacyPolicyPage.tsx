import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { Shield, Lock, Eye, UserCheck } from 'lucide-react';

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
            <p className="text-muted-foreground">Effective Date: [Insert Date]</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Marcoby ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how Nexus ("the Platform") collects, uses, discloses, and safeguards your information.
        </p>
      </div>

      {/* No Data Selling Statement */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-4">
          <Lock className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">We do not sell your data. Ever.</span>
        </CardContent>
      </Card>

      <Separator />

      {/* Information We Collect */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><b>Account & Profile Information: </b> Name, email, contact details, user roles, organization/workspace details</li>
          <li><b>Usage Data: </b> Logins, activity logs, feature usage, workflow actions, integrations used, support requests</li>
          <li><b>Device & Technical Data: </b> Browser, OS, device identifiers, IP address, time zone, cookies</li>
          <li><b>Content & Files: </b> Documents, tasks, notes, messages you create or upload, workflow data processed through integrations</li>
          <li><b>AI & Automation Data: </b> Prompts, agent conversations, actions taken by AI, data processed to provide automated recommendations</li>
        </ul>
      </div>

      <Separator />

      {/* How We Use Your Information */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Provide and operate Nexus and its features</li>
          <li>Personalize your experience and settings</li>
          <li>Secure the platform and prevent fraud</li>
          <li>Improve and develop new features</li>
          <li>Provide support and respond to inquiries</li>
          <li>Comply with legal and contractual obligations</li>
        </ul>
      </div>

      <Separator />

      {/* Sharing & Disclosure */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">3. Sharing & Disclosure</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li><b>With service providers: </b> For hosting, analytics, email, and integrations (subject to strict confidentiality)</li>
          <li><b>With authorized team members: </b> Per your organization’s permission settings</li>
          <li><b>Legal compliance:</b> If required by law or to protect the platform, users, or others</li>
          <li><b>Business transfers: </b> If Marcoby is involved in a merger, acquisition, or asset sale</li>
        </ul>
        <div className="mt-2 text-sm text-muted-foreground">
          <b>Subprocessors & Third-Party Integrations: </b> We use trusted third-party providers for hosting, analytics, and integrations. A list of subprocessors is available upon request.
        </div>
      </div>

      <Separator />

      {/* Data Security */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Encryption in transit and at rest</li>
          <li>Access controls and user authentication</li>
          <li>Regular audits and monitoring</li>
        </ul>
        <div className="mt-2 text-sm text-muted-foreground">
          <b>Self-Hosted Deployments: </b> For self-hosted deployments, security practices are the responsibility of your organization.
        </div>
      </div>

      <Separator />

      {/* Data Retention */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
        <p className="text-muted-foreground">
          We retain information for as long as your account is active, or as required for business or legal purposes. You may request deletion of your data at any time (see Contact below).
        </p>
      </div>

      <Separator />

      {/* International Data */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">6. International Data</h2>
        <p className="text-muted-foreground">
          If you use Nexus outside the United States, your information may be processed and stored in the US or other jurisdictions. We comply with applicable data protection laws regarding international transfers.
        </p>
      </div>

      <Separator />

      {/* Your Rights */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Access, correct, delete, or export your data</li>
          <li>Restrict or object to certain processing</li>
          <li>Withdraw consent at any time (where applicable)</li>
          <li>Lodge a complaint with a supervisory authority (if in the EEA/UK/Switzerland)</li>
        </ul>
        <div className="mt-2 text-sm text-muted-foreground">
          To exercise your rights, contact us at <span className="font-medium text-primary">privacy@marcoby.com</span>.
        </div>
      </div>

      <Separator />

      {/* Children’s Privacy */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">8. Children’s Privacy</h2>
        <p className="text-muted-foreground">
          Nexus is not intended for children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us for removal.
        </p>
      </div>

      <Separator />

      {/* Data Breach Notification */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">9. Data Breach Notification</h2>
        <p className="text-muted-foreground">
          In the event of a data breach that affects your personal information, we will notify you and relevant authorities as required by law.
        </p>
      </div>

      <Separator />

      {/* Changes to This Policy */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this Privacy Policy as needed. Changes will be posted here and, if significant, communicated directly to users.
        </p>
      </div>

      <Separator />

      {/* Cookies & Tracking */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">11. Cookies & Tracking</h2>
        <p className="text-muted-foreground">
          We use cookies and similar technologies to operate and improve Nexus. You can control cookies through your browser settings. For more information, see our Cookie Policy.
        </p>
      </div>

      <Separator />

      {/* Contact */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                For privacy-related questions or requests, contact: </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Marcoby Privacy Team</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: <a href="mailto:privacy@marcoby.com" className="text-primary underline">privacy@marcoby.com</a>
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Data Protection Officer</h3>
                  <p className="text-sm text-muted-foreground">
                    Email: <a href="mailto:dpo@marcoby.com" className="text-primary underline">dpo@marcoby.com</a>
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
