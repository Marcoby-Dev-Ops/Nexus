/**
 * Demo Login Page
 * 
 * Showcases available demo accounts and provides easy access
 * to demo the application with different permission levels
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Badge } from '@/shared/components/ui/Badge';
import { 
  User, 
  Shield, 
  Users, 
  Zap, 
  ArrowRight,
  Info,
  Play
} from 'lucide-react';
import { useDemoAuth } from '@/shared/hooks/useDemoAuth';
import { DEMO_ACCOUNTS } from '@/shared/config/demoConfig';
import { useToast } from '@/shared/components/ui/use-toast';

export default function DemoLoginPage() {
  const navigate = useNavigate();
  const { signInDemo, demoLoading } = useDemoAuth();
  const { toast } = useToast();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const handleDemoLogin = async (email: string) => {
    const account = DEMO_ACCOUNTS.find(acc => acc.email === email);
    if (!account) return;

    try {
      const result = await signInDemo(email, account.password);
      
      if (result.error) {
        toast({
          title: 'Demo Login Failed',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Demo Login Successful',
          description: `Welcome ${account.name}! You're now in demo mode.`,
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'manager':
        return <Users className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎭 Nexus Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience Nexus with realistic demo data. Choose an account to explore different features and permission levels.
          </p>
        </div>

        {/* Demo Accounts Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {DEMO_ACCOUNTS.map((account) => (
            <Card 
              key={account.id}
              className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                selectedAccount === account.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedAccount(account.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{account.avatar}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.company}</p>
                  </div>
                </div>
                <Badge className={getRoleColor(account.role)}>
                  <div className="flex items-center space-x-1">
                    {getRoleIcon(account.role)}
                    <span className="text-xs font-medium">{account.role}</span>
                  </div>
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p><strong>Email:</strong> {account.email}</p>
                  <p><strong>Password:</strong> demo123</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {account.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={demoLoading}
                  className="w-full mt-4"
                >
                  {demoLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>Try Demo</span>
                    </div>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Features Overview */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Demo Features</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="space-y-2">
              <h3 className="font-medium">🎯 Dashboard & Analytics</h3>
              <ul className="space-y-1 text-xs">
                <li>• Real-time business metrics</li>
                <li>• Sales pipeline visualization</li>
                <li>• Marketing performance data</li>
                <li>• Financial health indicators</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">🤖 AI & Automation</h3>
              <ul className="space-y-1 text-xs">
                <li>• AI-powered insights</li>
                <li>• Automated workflows</li>
                <li>• Smart recommendations</li>
                <li>• Natural language processing</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">🔗 Integrations</h3>
              <ul className="space-y-1 text-xs">
                <li>• CRM connections (HubSpot, Salesforce)</li>
                <li>• Payment processing (Stripe, PayPal)</li>
                <li>• Communication tools (Slack, Teams)</li>
                <li>• Analytics platforms (Google Analytics)</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">⚙️ Business Tools</h3>
              <ul className="space-y-1 text-xs">
                <li>• Billing & subscription management</li>
                <li>• User & permission management</li>
                <li>• Company settings & configuration</li>
                <li>• Onboarding & training flows</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Real Login Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Have a real account? Sign in with your credentials
          </p>
          <Link to="/login">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>Go to Real Login</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 