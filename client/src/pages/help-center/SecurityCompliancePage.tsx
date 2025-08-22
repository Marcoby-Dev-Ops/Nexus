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
  Monitor
} from 'lucide-react';

export const SecurityCompliancePage: React.FC = () => {
  const securityMeasures = [
    {
      icon: <Lock className="h-5 w-5" />,
      title: 'End-to-End Encryption',
      description: 'All data encrypted with AES-256 in transit and at rest',
      details: ['TLS 1.3 for data in transit', 'AES-256 encryption at rest', 'Zero-knowledge architecture for sensitive data']
    },
    {
      icon: <Key className="h-5 w-5" />,
      title: 'Access Control',
      description: 'Multi-factor authentication and role-based permissions',
      details: ['2FA/MFA required for all accounts', 'Role-based access control (RBAC)', 'Regular access reviews and audits']
    },
    {
      icon: <Server className="h-5 w-5" />,
      title: 'Infrastructure Security',
      description: 'Hardened cloud infrastructure with continuous monitoring',
      details: ['AWS/Azure enterprise-grade hosting', 'Network segmentation and firewalls', '24/7 security monitoring']
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      title: 'Threat Detection',
      description: 'Real-time monitoring and automated threat response',
      details: ['Intrusion detection systems', 'Automated security alerts', 'Incident response procedures']
    }
  ];

  const complianceStandards = [
    {
      standard: 'SOC 2 Type II',
      description: 'Independently audited security controls',
      status: 'Certified',
      statusColor: 'bg-success/10 text-success',
      details: 'Annual audits by third-party security firms covering security, availability, processing integrity, confidentiality, and privacy'
    },
    {
      standard: 'GDPR',
      description: 'EU General Data Protection Regulation compliance',
      status: 'Compliant',
      statusColor: 'bg-success/10 text-success',
      details: 'Full compliance with EU data protection laws including data subject rights, consent management, and privacy by design'
    },
    {
      standard: 'ISO 27001',
      description: 'International information security standard',
      status: 'In Progress',
      statusColor: 'bg-primary/10 text-primary',
      details: 'Currently implementing ISO 27001 information security management system with certification expected Q2 2025'
    },
    {
      standard: 'CCPA',
      description: 'California Consumer Privacy Act compliance',
      status: 'Compliant',
      statusColor: 'bg-success/10 text-success',
      details: 'Full compliance with California privacy laws including consumer rights and data transparency requirements'
    }
  ];

  const dataProtection = [
    {
      category: 'Data Classification',
      icon: <Database className="h-5 w-5" />,
      measures: [
        'Automatic data classification and labeling',
        'Separate handling for sensitive vs. non-sensitive data',
        'Regular data inventory and mapping',
        'Data minimization principles applied'
      ]
    },
    {
      category: 'Access Management',
      icon: <Users className="h-5 w-5" />,
      measures: [
        'Principle of least privilege access',
        'Regular access reviews and cleanup',
        'Automated provisioning and deprovisioning',
        'Segregation of duties for critical operations'
      ]
    },
    {
      category: 'Data Retention',
      icon: <FileText className="h-5 w-5" />,
      measures: [
        'Automated data lifecycle management',
        'Clear retention policies by data type',
        'Secure data deletion procedures',
        'Regular compliance audits'
      ]
    },
    {
      category: 'Incident Response',
      icon: <AlertTriangle className="h-5 w-5" />,
      measures: [
        '24/7 security operations center',
        'Automated incident detection and response',
        'Clear escalation procedures',
        'Regular security drills and testing'
      ]
    }
  ];

  const securityCertifications = [
    { name: 'SOC 2 Type II', year: '2024', status: 'Current' },
    { name: 'PCI DSS', year: '2024', status: 'Current' },
    { name: 'ISO 27001', year: '2025', status: 'In Progress' },
    { name: 'FedRAMP', year: '2025', status: 'Planned' }
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
            <h1 className="text-4xl font-bold">Security & Compliance</h1>
            <p className="text-muted-foreground">Enterprise-grade security for your business data</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Nexus implements comprehensive security measures and maintains strict compliance with industry standards to protect your business data.
        </p>
        <div className="flex gap-2">
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
        </div>
      </div>

      {/* Security Measures */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Measures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {securityMeasures.map((measure, index) => (
            <Card key={index} className="hover: shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                      {measure.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{measure.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{measure.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {measure.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Compliance Standards */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Compliance Standards</h2>
        <div className="space-y-4">
          {complianceStandards.map((standard, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{standard.standard}</CardTitle>
                  <Badge variant="secondary" className={standard.statusColor}>
                    {standard.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{standard.description}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{standard.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Data Protection */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Data Protection Framework</h2>
        <div className="grid grid-cols-1 md: grid-cols-2 gap-6">
          {dataProtection.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-1.5 rounded bg-primary/10 text-primary">
                    {category.icon}
                  </div>
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.measures.map((measure, measureIndex) => (
                    <div key={measureIndex} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-success flex-shrink-0" />
                      <span>{measure}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Security Certifications Timeline */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Certifications</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                {securityCertifications.map((cert, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                    <div>
                      <h3 className="font-semibold">{cert.name}</h3>
                      <p className="text-sm text-muted-foreground">Target: {cert.year}</p>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={
                        cert.status === 'Current' ? 'bg-success/10 text-success' :
                        cert.status === 'In Progress' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-foreground'
                      }
                    >
                      {cert.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Incident Reporting */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Incident Reporting</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We take security incidents seriously and have established procedures for rapid response and transparent communication.
              </p>
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Report Security Issues
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    security@nexus.com
                  </p>
                  <p className="text-xs text-muted-foreground">
                    24/7 monitoring with response within 1 hour for critical issues
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Security Status
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    status.nexus.com
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Real-time security status and incident communications
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Security Best Practices */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Best Practices for Users</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                While we secure our systems, here are recommendations to help protect your account: </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Account Security</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Enable two-factor authentication
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Use strong, unique passwords
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Regularly review account activity
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Log out from shared devices
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Data Protection</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Review integration permissions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Monitor data sharing settings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Report suspicious activity
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-success" />
                      Keep contact information updated
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Contact Information */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Security Contact Information</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Security Team</h3>
                <p className="text-sm text-muted-foreground">
                  security@nexus.com<br />
                  For security incidents and vulnerabilities
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Compliance Officer</h3>
                <p className="text-sm text-muted-foreground">
                  compliance@nexus.com<br />
                  For audit and compliance inquiries
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Privacy Officer</h3>
                <p className="text-sm text-muted-foreground">
                  privacy@nexus.com<br />
                  For data protection and privacy matters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 