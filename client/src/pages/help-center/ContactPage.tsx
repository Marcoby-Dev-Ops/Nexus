import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Separator } from '@/shared/components/ui/Separator';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Users,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const contactMethods = [
    {
      icon: <Mail className="h-5 w-5" />,
      title: 'Email Support',
      description: 'Get help with technical issues and account questions',
      contact: 'support@marcoby.com',
      responseTime: 'Within 24 hours',
      bestFor: 'Technical support, account issues, general questions'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Live Chat',
      description: 'Real-time support during business hours',
      contact: 'Available in-app',
      responseTime: 'Immediate',
      bestFor: 'Urgent issues, quick questions, real-time assistance'
    },
    {
      icon: <Phone className="h-5 w-5" />,
      title: 'Phone Support',
      description: 'Direct phone support for enterprise customers',
      contact: '+1 (555) 123-4567',
      responseTime: 'Within 4 hours',
      bestFor: 'Enterprise customers, complex issues, urgent matters'
    }
  ];

  const supportHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 6:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 4:00 PM EST' },
    { day: 'Sunday', hours: 'Email support only' }
  ];

  const departments = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Technical Support',
      description: 'Help with platform features, integrations, and technical issues',
      email: 'tech@marcoby.com'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Security & Compliance',
      description: 'Security concerns, compliance questions, and data protection',
      email: 'security@marcoby.com'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Account Management',
      description: 'Billing, account changes, and subscription management',
      email: 'accounts@marcoby.com'
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Partnerships',
      description: 'Business partnerships, integrations, and enterprise inquiries',
      email: 'partnerships@marcoby.com'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Contact Us</h1>
            <p className="text-muted-foreground">Get the help you need, when you need it</p>
          </div>
        </div>
        <p className="text-lg text-muted-foreground">
          Our support team is here to help you get the most out of Nexus. 
          Choose the contact method that works best for you.
        </p>
      </div>

      {/* Contact Methods */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">How Can We Help?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contactMethods.map((method, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {method.icon}
                  <div>
                    <CardTitle className="text-lg">{method.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">Contact:</p>
                    <p className="text-sm text-muted-foreground">{method.contact}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Response Time:</p>
                    <p className="text-sm text-muted-foreground">{method.responseTime}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Best For:</p>
                    <p className="text-sm text-muted-foreground">{method.bestFor}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Support Hours */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Support Hours</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">When We're Available</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {supportHours.map((schedule, index) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <p className="font-medium text-sm">{schedule.day}</p>
                  <p className="text-sm text-muted-foreground">{schedule.hours}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              * Emergency support is available 24/7 for critical issues affecting your business operations.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Department Contacts */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Contact by Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departments.map((dept, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {dept.icon}
                  <div>
                    <CardTitle className="text-lg">{dept.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{dept.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Email {dept.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Contact Form */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <Input id="firstName" placeholder="Your first name" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <Input id="lastName" placeholder="Your last name" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <Input id="email" type="email" placeholder="your.email@company.com" />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Company (Optional)
                  </label>
                  <Input id="company" placeholder="Your company name" />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <Input id="subject" placeholder="What can we help you with?" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <Textarea 
                  id="message" 
                  placeholder="Please describe your question or issue in detail..."
                  rows={5}
                />
              </div>

              <div className="flex items-center gap-4">
                <Button type="submit" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" type="button">
                  Save Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Office Location */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">Visit Our Office</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Marcoby Headquarters</h3>
                <p className="text-muted-foreground mb-2">
                  123 Innovation Drive<br />
                  Suite 456<br />
                  San Francisco, CA 94105<br />
                  United States
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Our office is open by appointment only. 
                  Please contact us in advance to schedule a visit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>We typically respond to all inquiries within 24 hours during business days.</p>
      </div>
    </div>
  );
};
