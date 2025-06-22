/**
 * Email Setup Modal for Unified Inbox
 * Pillar: 2 - Minimum Lovable Feature Set
 * Supports Gmail, Outlook, Exchange, and custom IMAP/SMTP providers
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Shield,
  Key,
  Globe,
  Server,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink,
  Lock,
  Zap,
  Clock,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useNotifications } from '@/contexts/NotificationContext';
import { unifiedInboxService, type EmailAccount } from '@/lib/services/unifiedInboxService';
import { supabase } from '@/lib/supabase';

interface EmailSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (account: EmailAccount) => void;
}

interface EmailProvider {
  id: 'gmail' | 'outlook' | 'exchange' | 'imap';
  name: string;
  icon: React.ReactNode;
  authType: 'oauth' | 'credentials';
  difficulty: 'easy' | 'medium' | 'advanced';
  description: string;
  features: string[];
  setupTime: string;
  popular?: boolean;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: <Mail className="w-6 h-6 text-destructive" />,
    authType: 'oauth',
    difficulty: 'easy',
    description: 'Connect your Google Gmail account with one click',
    features: ['OAuth 2.0 Security', 'Real-time sync', 'Full search', 'Labels support'],
    setupTime: '2 minutes',
    popular: true
  },
  {
    id: 'outlook',
    name: 'Microsoft 365',
    icon: <Mail className="w-6 h-6 text-primary" />,
    authType: 'oauth',
    difficulty: 'easy',
    description: 'Connect your Microsoft 365 account securely',
    features: ['OAuth 2.0 Security', 'Calendar sync', 'Contacts sync', 'Teams integration'],
    setupTime: '2 minutes',
    popular: true
  },
  {
    id: 'exchange',
    name: 'Exchange Server',
    icon: <Server className="w-6 h-6 text-secondary" />,
    authType: 'credentials',
    difficulty: 'medium',
    description: 'Connect to your organization\'s Exchange server',
    features: ['Enterprise security', 'Global address list', 'Calendar sync', 'Advanced rules'],
    setupTime: '5 minutes'
  },
  {
    id: 'imap',
    name: 'Custom IMAP',
    icon: <Globe className="w-6 h-6 text-muted-foreground" />,
    authType: 'credentials',
    difficulty: 'advanced',
    description: 'Connect any email provider using IMAP/SMTP',
    features: ['Universal compatibility', 'Custom settings', 'SSL/TLS support', 'Port configuration'],
    setupTime: '10 minutes'
  }
];

const EmailSetupModal: React.FC<EmailSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<EmailProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    imapHost: '',
    imapPort: '993',
    smtpHost: '',
    smtpPort: '587',
    useSsl: true,
    syncFrequency: '5',
    aiPriority: true,
    aiSummary: true,
    aiSuggestions: true,
    aiCategorize: true,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { addNotification } = useNotifications();

  const steps: SetupStep[] = [
    {
      id: 'provider',
      title: 'Choose Provider',
      description: 'Select your email provider',
      completed: !!selectedProvider
    },
    {
      id: 'authentication',
      title: 'Authentication',
      description: 'Connect your account securely',
      completed: false
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Configure sync settings',
      completed: false
    },
    {
      id: 'testing',
      title: 'Test & Complete',
      description: 'Verify connection and finish setup',
      completed: false
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProviderSelect = (provider: EmailProvider) => {
    setSelectedProvider(provider);
    if (provider.id === 'gmail') {
      setFormData(prev => ({
        ...prev,
        imapHost: 'imap.gmail.com',
        imapPort: '993',
        smtpHost: 'smtp.gmail.com',
        smtpPort: '587'
      }));
    } else if (provider.id === 'outlook') {
      setFormData(prev => ({
        ...prev,
        imapHost: 'outlook.office365.com',
        imapPort: '993',
        smtpHost: 'smtp.office365.com',
        smtpPort: '587'
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.email) {
      errors.push('Email address is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (selectedProvider?.authType === 'credentials') {
      if (!formData.password) {
        errors.push('Password is required');
      }
      
      if (selectedProvider.id === 'imap') {
        if (!formData.imapHost) errors.push('IMAP host is required');
        if (!formData.smtpHost) errors.push('SMTP host is required');
        if (!formData.imapPort || isNaN(Number(formData.imapPort))) {
          errors.push('Valid IMAP port is required');
        }
        if (!formData.smtpPort || isNaN(Number(formData.smtpPort))) {
          errors.push('Valid SMTP port is required');
        }
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleOAuthConnect = async () => {
    if (!selectedProvider) return;
    
    setIsConnecting(true);
    
    try {
      if (selectedProvider.id === 'gmail') {
        window.open(
          `https://accounts.google.com/oauth/authorize?client_id=your-client-id&redirect_uri=${window.location.origin}/auth/gmail/callback&scope=https://www.googleapis.com/auth/gmail.readonly&response_type=code&state=${Date.now()}`,
          'gmail-oauth',
          'width=600,height=700'
        );
      } else if (selectedProvider.id === 'outlook') {
        // Check if user is already authenticated with Microsoft
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.app_metadata?.provider === 'azure' || user?.app_metadata?.providers?.includes('azure')) {
          // User is already authenticated with Microsoft, create email account directly
          try {
            const userEmail = user.email || user.user_metadata?.email;
            if (!userEmail) {
              throw new Error('Unable to determine email address from Microsoft account');
            }

            // First check if account already exists
            const existingAccounts = await unifiedInboxService.getEmailAccounts();
            const existingAccount = existingAccounts.find(
              acc => acc.provider === 'outlook' && acc.email_address === userEmail
            );

            let account;
            if (existingAccount) {
              // Account already exists, use it
              account = existingAccount;
              addNotification({
                type: 'success',
                message: `Microsoft 365 account (${userEmail}) is already connected and ready to use!`
              });
            } else {
              // Create new account
              const accountData = {
                email_address: userEmail,
                display_name: user.user_metadata?.full_name || userEmail,
                provider: 'outlook' as const,
                sync_enabled: true,
                sync_frequency: `${formData.syncFrequency} minutes`,
                ai_priority_enabled: formData.aiPriority,
                ai_summary_enabled: formData.aiSummary,
                ai_suggestions_enabled: formData.aiSuggestions,
                ai_auto_categorize_enabled: formData.aiCategorize,
              };

              account = await unifiedInboxService.addEmailAccount(accountData);
              addNotification({
                type: 'success',
                message: `Successfully connected ${selectedProvider.name} account using your existing Microsoft 365 authentication!`
              });
            }
            
            onComplete(account);
            setIsConnecting(false);
            onClose();
            return;
            
          } catch (error) {
            console.error('Failed to create Office 365 email account:', error);
            addNotification({
              type: 'error',
              message: 'Failed to connect Office 365 account. Please try again.'
            });
            setIsConnecting(false);
            return;
          }
        } else {
          // User needs to authenticate with Microsoft first
          addNotification({
            type: 'info',
            message: 'To connect Office 365, you need to sign in with your Microsoft account first.'
          });
          
          // Store callback info for after OAuth
          localStorage.setItem('nexus_oauth_callback', JSON.stringify({
            type: 'email_setup',
            provider: 'outlook',
            timestamp: Date.now()
          }));
          
          // Redirect to Microsoft OAuth for the entire application
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
              scopes: 'openid email profile https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite offline_access',
              redirectTo: `${window.location.origin}/auth/callback?setup=email`
            }
          });
          
          if (error) {
            console.error('Microsoft OAuth error:', error);
            addNotification({
              type: 'error',
              message: 'Failed to initiate Microsoft authentication. Please try again.'
            });
          }
          
          setIsConnecting(false);
          return;
        }
      }
      
    } catch (error) {
      console.error('OAuth connection failed:', error);
      addNotification({
        type: 'error',
        message: 'Failed to connect account. Please try again.'
      });
      setIsConnecting(false);
    }
  };

  const handleCredentialsConnect = async () => {
    if (!selectedProvider || !validateForm()) return;
    
    setIsConnecting(true);
    
    try {
      const accountData = {
        email_address: formData.email,
        display_name: formData.displayName || formData.email,
        provider: selectedProvider.id as any,
        sync_frequency: `${formData.syncFrequency} minutes`,
        ai_priority_enabled: formData.aiPriority,
        ai_summary_enabled: formData.aiSummary,
        ai_suggestions_enabled: formData.aiSuggestions,
        ai_auto_categorize_enabled: formData.aiCategorize,
        ...(selectedProvider.id === 'imap' && {
          imap_host: formData.imapHost,
          imap_port: Number(formData.imapPort),
          smtp_host: formData.smtpHost,
          smtp_port: Number(formData.smtpPort)
        })
      };

      const account = await unifiedInboxService.addEmailAccount(accountData);
      
      onComplete(account);
      addNotification({
        type: 'success',
        message: `Successfully connected ${selectedProvider.name} account!`
      });
      onClose();
      
    } catch (error) {
      console.error('Failed to connect email account:', error);
      addNotification({
        type: 'error',
        message: 'Failed to connect account. Please check your credentials and try again.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Email</h3>
              <p className="text-muted-foreground">
                Choose your email provider to get started with unified inbox
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EMAIL_PROVIDERS.map((provider) => (
                <Card
                  key={provider.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                    selectedProvider?.id === provider.id 
                      ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md' 
                      : 'hover:border-primary/50 hover:bg-muted/30'
                  }`}
                  onClick={() => handleProviderSelect(provider)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-2 bg-muted/50 rounded-lg">
                        {provider.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-base">{provider.name}</h4>
                          {provider.popular && (
                            <Badge variant="secondary" className="text-xs font-medium">Popular</Badge>
                          )}
                        </div>
                        <Badge 
                          variant={provider.difficulty === 'easy' ? 'default' : 
                                 provider.difficulty === 'medium' ? 'secondary' : 'outline'}
                          className="text-xs mb-3"
                        >
                          {provider.difficulty}
                        </Badge>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {provider.description}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1.5" />
                          <span>{provider.setupTime}</span>
                          <span className="mx-3">•</span>
                          <Shield className="w-3 h-3 mr-1.5" />
                          <span>{provider.authType === 'oauth' ? 'OAuth' : 'Credentials'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedProvider && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/5 border border-primary/20 rounded-xl p-6"
              >
                <h4 className="font-semibold mb-4 text-primary">What you'll get:</h4>
                <ul className="space-y-3">
                  {selectedProvider.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-success mr-3 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                {selectedProvider?.authType === 'oauth' ? (
                  <Shield className="w-6 h-6 text-primary" />
                ) : (
                  <Key className="w-6 h-6 text-primary" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Connect {selectedProvider?.name}
              </h3>
              <p className="text-muted-foreground">
                {selectedProvider?.authType === 'oauth' 
                  ? 'Securely authorize access to your account'
                  : 'Enter your email credentials to connect'
                }
              </p>
            </div>

            {selectedProvider?.authType === 'oauth' ? (
              <div className="space-y-6">
                <Alert className="p-4">
                  <Shield className="w-4 h-4" />
                  <AlertDescription className="ml-2">
                    We use OAuth 2.0 for secure authentication. Your password is never stored or shared.
                  </AlertDescription>
                </Alert>

                <div className="space-y-5">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium mb-2 block">Display Name (Optional)</Label>
                    <Input
                      id="displayName"
                      placeholder="My Work Email"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleOAuthConnect}
                  disabled={isConnecting || !formData.email}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Authorize with {selectedProvider?.name}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {validationErrors.length > 0 && (
                  <Alert variant="error" className="p-4">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="ml-2">
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName" className="text-sm font-medium mb-2 block">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="My Work Email"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium mb-2 block">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="pr-12 h-11"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {selectedProvider?.id === 'imap' && (
                  <div className="space-y-5 border-t border-border pt-6">
                    <h4 className="font-semibold text-base">Server Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="imapHost" className="text-sm font-medium mb-2 block">IMAP Host *</Label>
                        <Input
                          id="imapHost"
                          placeholder="imap.example.com"
                          value={formData.imapHost}
                          onChange={(e) => setFormData(prev => ({ ...prev, imapHost: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="imapPort" className="text-sm font-medium mb-2 block">IMAP Port *</Label>
                        <Input
                          id="imapPort"
                          placeholder="993"
                          value={formData.imapPort}
                          onChange={(e) => setFormData(prev => ({ ...prev, imapPort: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpHost" className="text-sm font-medium mb-2 block">SMTP Host *</Label>
                        <Input
                          id="smtpHost"
                          placeholder="smtp.example.com"
                          value={formData.smtpHost}
                          onChange={(e) => setFormData(prev => ({ ...prev, smtpHost: e.target.value }))}
                          className="h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="smtpPort" className="text-sm font-medium mb-2 block">SMTP Port *</Label>
                        <Input
                          id="smtpPort"
                          placeholder="587"
                          value={formData.smtpPort}
                          onChange={(e) => setFormData(prev => ({ ...prev, smtpPort: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="useSsl"
                        checked={formData.useSsl}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useSsl: checked as boolean }))}
                      />
                      <Label htmlFor="useSsl">Use SSL/TLS encryption</Label>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCredentialsConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Connect Account
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Configure Sync Settings</h3>
              <p className="text-muted-foreground">
                Customize how your emails are synchronized and processed
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="syncFrequency">Sync Frequency</Label>
                <Select
                  value={formData.syncFrequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, syncFrequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Every minute (Real-time)</SelectItem>
                    <SelectItem value="5">Every 5 minutes (Recommended)</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>AI Features</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="aiPriority" defaultChecked />
                    <Label htmlFor="aiPriority">AI Priority Scoring</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="aiSummary" defaultChecked />
                    <Label htmlFor="aiSummary">AI Email Summaries</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="aiActions" defaultChecked />
                    <Label htmlFor="aiActions">AI Action Suggestions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="aiCategories" defaultChecked />
                    <Label htmlFor="aiCategories">Automatic Categorization</Label>
                  </div>
                </div>
              </div>

              <Alert>
                <Users className="w-4 h-4" />
                <AlertDescription>
                  Your email data is processed securely and never shared. AI features help you stay organized and productive.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
              <p className="text-muted-foreground">
                Your {selectedProvider?.name} account has been successfully connected
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Account Connected</span>
                <Check className="w-4 h-4 text-success" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sync Configuration</span>
                <Check className="w-4 h-4 text-success" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">AI Features Enabled</span>
                <Check className="w-4 h-4 text-success" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Initial Sync</span>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>

            <Alert>
              <Clock className="w-4 h-4" />
              <AlertDescription>
                Your emails are being synchronized in the background. This may take a few minutes for the initial sync.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Connect Email Account</h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-6 py-4 border-b">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < currentStep 
                      ? 'bg-primary text-primary-foreground' 
                      : index === currentStep 
                        ? 'bg-primary/10 text-primary border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStep ? <Check className="w-3 h-3" /> : index + 1}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-8 py-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-8 py-6 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isConnecting}
            className="h-11 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={
                (currentStep === 0 && !selectedProvider) ||
                (currentStep === 1 && selectedProvider?.authType === 'oauth' && !formData.email) ||
                isConnecting
              }
              className="h-11 px-6"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose} className="bg-success hover:bg-success/90 h-11 px-6">
              <Check className="w-4 h-4 mr-2" />
              Finish
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmailSetupModal; 