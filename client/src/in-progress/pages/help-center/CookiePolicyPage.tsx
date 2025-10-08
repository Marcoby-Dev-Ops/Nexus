import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { Cookie, Shield, Settings, Eye, Clock } from 'lucide-react';

export const CookiePolicyPage: React.FC = () => {
  const cookieTypes = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Essential Cookies',
      description: 'Required for basic site functionality',
      examples: ['Authentication', 'Security', 'Session management'],
      duration: 'Session or 1 year'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: 'Functional Cookies',
      description: 'Enhance user experience and remember preferences',
      examples: ['Language settings', 'Theme preferences', 'Form data'],
      duration: '1 year'
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: 'Analytics Cookies',
      description: 'Help us understand how visitors use our site',
      examples: ['Page views', 'User behavior', 'Performance metrics'],
      duration: '2 years'
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Performance Cookies',
      description: 'Monitor site performance and optimize loading',
      examples: ['Load times', 'Error tracking', 'Resource optimization'],
      duration: '1 year'
    }
  ];

  const cookieDetails = [
    {
      name: 'nexus_session',
      purpose: 'Maintains your login session',
      duration: 'Session',
      type: 'Essential'
    },
    {
      name: 'nexus_preferences',
      purpose: 'Stores your UI preferences and settings',
      duration: '1 year',
      type: 'Functional'
    },
    {
      name: 'nexus_analytics',
      purpose: 'Tracks usage patterns to improve the service',
      duration: '2 years',
      type: 'Analytics'
    },
    {
      name: 'nexus_performance',
      purpose: 'Monitors site performance and errors',
      duration: '1 year',
      type: 'Performance'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Cookie className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Cookie Policy</h1>
            <p className="text-muted-foreground">How we use cookies and similar technologies</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          This Cookie Policy explains how Nexus uses cookies and similar technologies to provide, 
          protect, and improve our services. By using Nexus, you agree to our use of cookies as described in this policy.
        </p>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Shield className="h-3 w-3 mr-1" />
            GDPR Compliant
          </Badge>
          <Badge variant="secondary" className="bg-secondary/10 text-purple-800">
            <Settings className="h-3 w-3 mr-1" />
            User Control
          </Badge>
        </div>
      </div>

      {/* What Are Cookies */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
        <p className="text-muted-foreground mb-4">
          Cookies are small text files that are stored on your device when you visit a website. 
          They help websites remember information about your visit, such as your preferred language 
          and other settings, which can make your next visit easier and more useful.
        </p>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">How We Use Cookies</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>Keep you signed in</li>
                  <li>Remember your preferences</li>
                  <li>Understand how you use our service</li>
                  <li>Improve performance and security</li>
                  <li>Provide personalized content</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Your Control</h3>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>Manage cookies in your browser settings</li>
                  <li>Delete cookies at any time</li>
                  <li>Opt out of non-essential cookies</li>
                  <li>Contact us with questions</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Types of Cookies */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Types of Cookies We Use</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cookieTypes.map((type, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {type.icon}
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Examples:</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                      {type.examples.map((example, i) => (
                        <li key={i}>{example}</li>
                      ))}
                    </ul>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Duration: {type.duration}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Specific Cookies */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Specific Cookies We Use</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Cookie Name</th>
                    <th className="text-left py-2 font-medium">Purpose</th>
                    <th className="text-left py-2 font-medium">Duration</th>
                    <th className="text-left py-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {cookieDetails.map((cookie, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 font-mono text-xs">{cookie.name}</td>
                      <td className="py-2">{cookie.purpose}</td>
                      <td className="py-2">{cookie.duration}</td>
                      <td className="py-2">
                        <Badge variant="secondary" className="text-xs">
                          {cookie.type}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Managing Cookies */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Managing Your Cookie Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Browser Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Most browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Block all cookies</li>
                <li>Allow only essential cookies</li>
                <li>Delete cookies when you close your browser</li>
                <li>View and delete existing cookies</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Nexus Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Within Nexus, you can control certain cookie preferences:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                <li>Opt out of analytics tracking</li>
                <li>Manage notification preferences</li>
                <li>Control personalized content</li>
                <li>Export or delete your data</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Third-Party Cookies */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
        <p className="text-muted-foreground mb-4">
          We may use third-party services that set their own cookies. These services help us:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Google Analytics and similar services to understand usage patterns
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Security</h3>
              <p className="text-sm text-muted-foreground">
                Cloudflare and security services to protect against threats
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Support</h3>
              <p className="text-sm text-muted-foreground">
                Customer support tools to provide better assistance
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Updates */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Updates to This Policy</h2>
        <p className="text-muted-foreground">
          We may update this Cookie Policy from time to time to reflect changes in our practices 
          or for other operational, legal, or regulatory reasons. We will notify you of any 
          material changes by posting the new policy on this page and updating the "Last Updated" date.
        </p>
      </div>

      <Separator />

      {/* Contact */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              If you have any questions about our use of cookies, please contact us:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Privacy Team</h3>
                <p className="text-sm text-muted-foreground">
                  Email: <a href="mailto:privacy@marcoby.com" className="text-primary underline">privacy@marcoby.com</a>
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Support Team</h3>
                <p className="text-sm text-muted-foreground">
                  Email: <a href="mailto:support@marcoby.com" className="text-primary underline">support@marcoby.com</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};
