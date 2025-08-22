import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { 
  Shield, 
  Lock, 
  Database, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Key,
  Server,
  Users,
  FileText,
  Monitor,
  Zap,
  Globe,
  Building
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
  const securityFeatures = [
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'End-to-End Encryption',
      description: 'All data encrypted with AES-256 in transit and at rest',
      details: ['TLS 1.3 for data in transit', 'AES-256 encryption at rest', 'Zero-knowledge architecture for sensitive data']
    },
    {
      icon: <Key className="h-5 w-5" />,
      title: 'Multi-Factor Authentication',
      description: 'Multiple layers of authentication to protect your account',
      details: ['2FA/MFA required for all accounts', 'Role-based access control (RBAC)', 'Regular access reviews and audits']
    },
    {
      icon: <Server className="h-5 w-5" />,
      title: 'Enterprise Infrastructure',
      description: 'Hardened cloud infrastructure with continuous monitoring',
      details: ['AWS/Azure enterprise-grade hosting', 'Network segmentation and firewalls', '24/7 security monitoring']
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      title: 'Real-Time Threat Detection',
      description: 'Advanced monitoring and automated threat response',
      details: ['Intrusion detection systems', 'Automated security alerts', 'Incident response procedures']
    }
  ];

  const complianceStandards = [
    {
      name: 'SOC 2 Type II',
      status: 'Certified',
      year: '2024',
      description: 'Service Organization Control 2 compliance for security, availability, and confidentiality'
    },
    {
      name: 'GDPR',
      status: 'Compliant',
      year: '2024',
      description: 'General Data Protection Regulation compliance for EU data protection'
    },
    {
      name: 'CCPA',
      status: 'Compliant',
      year: '2024',
      description: 'California Consumer Privacy Act compliance for California residents'
    },
    {
      name: 'ISO 27001',
      status: 'In Progress',
      year: '2025',
      description: 'Information Security Management System certification'
    }
  ];

  const securityPractices = [
    {
      category: 'Data Protection',
      practices: [
        'Encryption at rest and in transit',
        'Regular security audits',
        'Data backup and recovery',
        'Access logging and monitoring'
      ]
    },
    {
      category: 'Access Control',
      practices: [
        'Multi-factor authentication',
        'Role-based permissions',
        'Session management',
        'Privileged access management'
      ]
    },
    {
      category: 'Infrastructure',
      practices: [
        'Secure cloud hosting',
        'Network security',
        'Vulnerability management',
        'Incident response'
      ]
    },
    {
      category: 'Compliance',
      practices: [
        'Regular compliance audits',
        'Privacy by design',
        'Data retention policies',
        'Third-party risk management'
      ]
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
            <h1 className="text-4xl font-bold">Security</h1>
            <p className="text-muted-foreground">Enterprise-grade security for your business data</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          At Nexus, security is not just a feature—it's fundamental to everything we do. 
          We implement industry-leading security measures to protect your business data and ensure compliance with global standards.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-success/10 text-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            SOC 2 Type II
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Lock className="h-3 w-3 mr-1" />
            AES-256 Encrypted
          </Badge>
          <Badge variant="secondary" className="bg-secondary/10 text-purple-800">
            <Shield className="h-3 w-3 mr-1" />
            GDPR Compliant
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Globe className="h-3 w-3 mr-1" />
            Global Standards
          </Badge>
        </div>
      </div>

      {/* Security Features */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {feature.icon}
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Compliance Standards */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Compliance & Certifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complianceStandards.map((standard, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{standard.name}</CardTitle>
                  <Badge 
                    variant={standard.status === 'Certified' || standard.status === 'Compliant' ? 'default' : 'secondary'}
                    className={standard.status === 'Certified' || standard.status === 'Compliant' ? 'bg-success/10 text-success' : ''}
                  >
                    {standard.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{standard.year}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{standard.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Security Practices */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Security Practices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityPractices.map((practice, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {practice.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {practice.practices.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Data Protection */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Data Protection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Data Encryption</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AES-256 encryption at rest</li>
                <li>• TLS 1.3 for data in transit</li>
                <li>• Encrypted backups</li>
                <li>• Key management system</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Access Control</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi-factor authentication</li>
                <li>• Role-based permissions</li>
                <li>• Session management</li>
                <li>• Audit logging</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Privacy</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Privacy by design</li>
                <li>• Data minimization</li>
                <li>• User consent management</li>
                <li>• Right to deletion</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Incident Response */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Incident Response</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Our Response Process</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-sm">Detection</p>
                      <p className="text-xs text-muted-foreground">Automated monitoring and alerting systems</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-sm">Assessment</p>
                      <p className="text-xs text-muted-foreground">Rapid evaluation of impact and scope</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-sm">Response</p>
                      <p className="text-xs text-muted-foreground">Immediate containment and mitigation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-sm">Recovery</p>
                      <p className="text-xs text-muted-foreground">Restoration of normal operations</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Customer Communication</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Immediate notification of security incidents</li>
                  <li>• Regular updates on incident status</li>
                  <li>• Post-incident analysis and lessons learned</li>
                  <li>• Transparent reporting on security measures</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Security Team */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Team</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Our dedicated security team works around the clock to protect your data and maintain the highest security standards.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Security Engineers</h3>
                <p className="text-xs text-muted-foreground">Infrastructure & application security</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Security Analysts</h3>
                <p className="text-xs text-muted-foreground">Threat detection & response</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">Compliance Specialists</h3>
                <p className="text-xs text-muted-foreground">Regulatory compliance & audits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Contact */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Contact</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              For security-related questions, vulnerabilities, or incidents, please contact our security team:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Security Team</h3>
                <p className="text-sm text-muted-foreground">
                  Email: <a href="mailto:security@marcoby.com" className="text-primary underline">security@marcoby.com</a>
                </p>
                <p className="text-sm text-muted-foreground">
                  PGP Key: <a href="/security/pgp-key.txt" className="text-primary underline">Download</a>
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Bug Bounty Program</h3>
                <p className="text-sm text-muted-foreground">
                  Report vulnerabilities: <a href="mailto:bugs@marcoby.com" className="text-primary underline">bugs@marcoby.com</a>
                </p>
                <p className="text-sm text-muted-foreground">
                  Rewards for valid security reports
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
