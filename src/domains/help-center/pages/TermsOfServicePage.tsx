import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { FileText, Shield, Users, CreditCard, Zap } from 'lucide-react';
import { Seo } from '@/shared/components/Seo';

export const TermsOfServicePage: React.FC = () => {
  const keyTerms = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee and 24/7 monitoring.'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Team Collaboration',
      description: 'Unlimited team members with role-based access controls and real-time collaboration.'
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'AI-Powered Features',
      description: 'Advanced AI capabilities including predictive analytics, automated workflows, and intelligent insights.'
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: 'Flexible Pricing',
      description: 'Transparent pricing with no hidden fees. Cancel or change plans at any time.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Seo
        title="Terms of Service – Nexus Platform | Marcoby"
        description="Read the terms and conditions for using Nexus, our AI-powered business operating system."
        canonical="https: //nexus.marcoby.com/help/terms-of-service"
        image="https://nexus.marcoby.com/og-image.png"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Marcoby',
          url: 'https://nexus.marcoby.com/',
          logo: 'https://nexus.marcoby.com/nexus-horizontal-160x48-transparent.png',
          sameAs: [
            'https://www.linkedin.com/company/marcoby',
            'https: //twitter.com/marcobyhq'
          ]
        }}
      />
      
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Effective Date: [Insert Date]</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          These Terms of Service ("Terms") govern your use of Nexus, an AI-powered business operating system provided by Marcoby ("we", "us", or "our").
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
        {keyTerms.map((term, index) => (
          <Card key={index}>
            <CardContent className="pt-6 flex items-start gap-4">
              <div className="text-primary">{term.icon}</div>
              <div>
                <h3 className="font-semibold mb-2">{term.title}</h3>
                <p className="text-sm text-muted-foreground">{term.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Acceptance of Terms */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground mb-4">
          By accessing or using Nexus, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the service.
        </p>
        <p className="text-muted-foreground">
          These Terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
        </p>
      </div>

      <Separator />

      {/* Description of Service */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
        <p className="text-muted-foreground mb-4">
          Nexus is an AI-powered business operating system that provides: </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Business intelligence and analytics</li>
          <li>AI-powered automation and workflows</li>
          <li>Team collaboration and communication tools</li>
          <li>Integration with third-party business applications</li>
          <li>Predictive analytics and insights</li>
          <li>Custom reporting and dashboards</li>
        </ul>
      </div>

      <Separator />

      {/* User Accounts */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You must provide accurate and complete information when creating an account</li>
          <li>You are responsible for maintaining the security of your account credentials</li>
          <li>You are responsible for all activities that occur under your account</li>
          <li>You must notify us immediately of any unauthorized use of your account</li>
          <li>We reserve the right to terminate accounts that violate these Terms</li>
        </ul>
      </div>

      <Separator />

      {/* Acceptable Use */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
        <p className="text-muted-foreground mb-4">You agree not to use the service to:</p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Violate any applicable laws or regulations</li>
          <li>Infringe on the rights of others</li>
          <li>Upload malicious code or attempt to compromise system security</li>
          <li>Use the service for spam or unsolicited communications</li>
          <li>Attempt to reverse engineer or decompile the service</li>
          <li>Use the service for any illegal or unauthorized purpose</li>
        </ul>
      </div>

      <Separator />

      {/* Payment Terms */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>Subscription fees are billed in advance on a monthly or annual basis</li>
          <li>All fees are non-refundable except as required by law</li>
          <li>We may change our pricing with 30 days notice</li>
          <li>You may cancel your subscription at any time</li>
          <li>Unpaid accounts may be suspended or terminated</li>
        </ul>
      </div>

      <Separator />

      {/* Data and Privacy */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">6. Data and Privacy</h2>
        <p className="text-muted-foreground mb-4">
          Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You retain ownership of your data</li>
          <li>We process your data to provide and improve our services</li>
          <li>We implement appropriate security measures to protect your data</li>
          <li>You may export your data at any time</li>
        </ul>
      </div>

      <Separator />

      {/* Intellectual Property */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>The service and its original content are owned by Marcoby</li>
          <li>You retain ownership of content you create using the service</li>
          <li>You grant us a license to use your content to provide the service</li>
          <li>You may not use our trademarks without written permission</li>
        </ul>
      </div>

      <Separator />

      {/* Limitation of Liability */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
        <p className="text-muted-foreground mb-4">
          To the maximum extent permitted by law, Marcoby shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
        </p>
        <p className="text-muted-foreground">
          Our total liability to you for any claims arising from these Terms or your use of the service shall not exceed the amount you paid us in the 12 months preceding the claim.
        </p>
      </div>

      <Separator />

      {/* Termination */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
          <li>You may terminate your account at any time</li>
          <li>We may terminate or suspend your account for violations of these Terms</li>
          <li>Upon termination, your right to use the service ceases immediately</li>
          <li>We may retain your data for a reasonable period after termination</li>
        </ul>
      </div>

      <Separator />

      {/* Changes to Terms */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
        <p className="text-muted-foreground">
          We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the service. Your continued use of the service after such modifications constitutes acceptance of the updated Terms.
        </p>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
        <p className="text-muted-foreground">
          If you have any questions about these Terms, please contact us at: </p>
        <div className="mt-4 p-4 bg-card border rounded-lg">
          <p className="font-medium">Marcoby</p>
          <p className="text-muted-foreground">Email: legal@marcoby.com</p>
          <p className="text-muted-foreground">Address: [Insert Address]</p>
        </div>
      </div>
    </div>
  );
}; 