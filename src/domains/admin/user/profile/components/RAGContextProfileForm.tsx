import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Badge } from '@/shared/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Progress } from '@/shared/components/ui/Progress';
import { Brain, Target, TrendingUp, CheckCircle2, Save, Sparkles, Building2 } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { profileContextService, type RAGProfileContext, type ProfileContextUpdate } from '@/domains/admin';
import { ButtonSpinner } from '@/shared/components/patterns/LoadingStates';

interface RAGContextProfileFormProps {
  onSave?: (context: RAGProfileContext) => void;
  onCancel?: () => void;
  showPreview?: boolean;
}

export const RAGContextProfileForm: React.FC<RAGContextProfileFormProps> = ({ 
  onSave, 
  onCancel, 
  showPreview = true 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState<Partial<RAGProfileContext>>({});
  const [activeSection, setActiveSection] = useState('identity');
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Load existing context
  useEffect(() => {
    const loadContext = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const ragContext = await profileContextService.getUserRAGContext(user.id);
        if (ragContext) {
          setContext(ragContext);
          setCompletionPercentage(ragContext.profile_completion_percentage);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error loading RAG context: ', error);
      } finally {
        setLoading(false);
      }
    };

    loadContext();
  }, [user?.id]);

  const handleFieldChange = (field: keyof RAGProfileContext, value: any) => {
    setContext(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field: keyof RAGProfileContext, values: string[]) => {
    setContext(prev => ({ ...prev, [field]: values }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const success = await profileContextService.updateRAGContext(user.id, context as ProfileContextUpdate);
      if (success) {
        const updatedContext = await profileContextService.getUserRAGContext(user.id);
        if (updatedContext) {
          setContext(updatedContext);
          setCompletionPercentage(updatedContext.profile_completion_percentage);
          onSave?.(updatedContext);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error saving RAG context: ', error);
    } finally {
      setSaving(false);
    }
  };

  const getAIImpactPreview = () => {
    const hasBasicInfo = context.name && context.role && context.department;
    const hasContext = context.experience_level && context.communication_style;
    const hasGoals = context.immediate_goals && context.primary_responsibilities?.length;

    if (!hasBasicInfo) {
      return {
        level: 'Generic',
        color: 'text-muted-foreground',
        description: 'Standard AI responses without personalization',
        example: 'Here is some general information about sales performance.'
      };
    }

    if (!hasContext) {
      return {
        level: 'Basic',
        color: 'text-warning',
        description: 'AI knows your role but lacks context',
        example: `${context.name}, here's your department's performance data.`
      };
    }

    if (!hasGoals) {
      return {
        level: 'Good',
        color: 'text-primary',
        description: 'AI understands your communication style',
        example: `${context.name}, as ${context.job_title}, here's a ${context.communication_style} overview of your metrics.`
      };
    }

    return {
      level: 'Expert',
      color: 'text-success',
      description: 'Highly personalized AI assistance',
      example: `${context.name}, focusing on your goal to ${context.immediate_goals}, your ${context.department} team is performing 15% above target. I recommend prioritizing the $340K deal closing next week.`
    };
  };

  const aiImpact = getAIImpactPreview();

  const sections = [
    {
      id: 'identity',
      title: 'Identity & Role',
      icon: <Building2 className="w-5 h-5" />,
      description: 'Basic information about who you are'
    },
    {
      id: 'context',
      title: 'Work Context',
      icon: <Brain className="w-5 h-5" />,
      description: 'How you work and communicate'
    },
    {
      id: 'goals',
      title: 'Goals & Priorities',
      icon: <Target className="w-5 h-5" />,
      description: 'What you want to achieve'
    },
    {
      id: 'business',
      title: 'Business Context',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Your business environment'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your profile context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold">Personalize Your AI Assistant</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Help Nexus understand you better to provide more relevant, personalized assistance. 
          The more you share, the smarter your AI becomes.
        </p>
        
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg: grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Sections</CardTitle>
              <CardDescription>Complete each section to improve AI assistance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg text-left transition-colors ${
                    activeSection === section.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover: bg-muted'
                  }`}
                >
                  {section.icon}
                  <div>
                    <div className="font-medium">{section.title}</div>
                    <div className="text-xs opacity-75">{section.description}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* AI Impact Preview */}
          {showPreview && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Response Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Level: </span>
                    <Badge variant="outline" className={aiImpact.color}>
                      {aiImpact.level}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {aiImpact.description}
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Example Response:</p>
                    <p className="text-sm italic text-muted-foreground">
                      "{aiImpact.example}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Form Content */}
        <div className="lg: col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {sections.find(s => s.id === activeSection)?.icon}
                {sections.find(s => s.id === activeSection)?.title}
              </CardTitle>
              <CardDescription>
                {sections.find(s => s.id === activeSection)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Identity & Role Section */}
              {activeSection === 'identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name *</Label>
                      <Input
                        id="name"
                        value={context.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="How should AI address you?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title *</Label>
                      <Input
                        id="job_title"
                        value={context.job_title || ''}
                        onChange={(e) => handleFieldChange('job_title', e.target.value)}
                        placeholder="e.g., VP of Sales, Marketing Manager"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select value={context.department || ''} onValueChange={(value) => handleFieldChange('department', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                          <SelectItem value="it">IT</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Access Level</Label>
                      <Select value={context.role || 'user'} onValueChange={(value) => handleFieldChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Context Section */}
              {activeSection === 'context' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience_level">Experience Level *</Label>
                      <Select value={context.experience_level || ''} onValueChange={(value) => handleFieldChange('experience_level', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Your experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner - New to business intelligence</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Some experience</SelectItem>
                          <SelectItem value="advanced">Advanced - Very experienced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="communication_style">Communication Style *</Label>
                      <Select value={context.communication_style || ''} onValueChange={(value) => handleFieldChange('communication_style', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="How you prefer information" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct - Brief and to the point</SelectItem>
                          <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                          <SelectItem value="visual">Visual - Charts and diagrams</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="time_availability">Time Availability</Label>
                      <Select value={context.time_availability || ''} onValueChange={(value) => handleFieldChange('time_availability', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Time for reviewing insights" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Quick summaries only</SelectItem>
                          <SelectItem value="medium">Medium - Balanced detail</SelectItem>
                          <SelectItem value="high">High - In-depth analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collaboration_frequency">Work Style</Label>
                      <Select value={context.collaboration_frequency || ''} onValueChange={(value) => handleFieldChange('collaboration_frequency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="How you work" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo - Independent work</SelectItem>
                          <SelectItem value="small-team">Small Team - Close collaboration</SelectItem>
                          <SelectItem value="cross-functional">Cross-functional - Multiple departments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Goals & Priorities Section */}
              {activeSection === 'goals' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="immediate_goals">Primary Goal *</Label>
                    <Input
                      id="immediate_goals"
                      value={context.immediate_goals || ''}
                      onChange={(e) => handleFieldChange('immediate_goals', e.target.value)}
                      placeholder="e.g., Increase sales by 25%, Improve team efficiency"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primary_responsibilities">Key Responsibilities</Label>
                    <Textarea
                      id="primary_responsibilities"
                      value={context.primary_responsibilities?.join(', ') || ''}
                      onChange={(e) => handleArrayFieldChange('primary_responsibilities', e.target.value.split(', ').filter(Boolean))}
                      placeholder="e.g., Team management, Budget planning, Client relations"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple responsibilities with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_pain_points">Current Challenges</Label>
                    <Textarea
                      id="current_pain_points"
                      value={context.current_pain_points?.join(', ') || ''}
                      onChange={(e) => handleArrayFieldChange('current_pain_points', e.target.value.split(', ').filter(Boolean))}
                      placeholder="e.g., Data silos, Manual processes, Communication gaps"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">What challenges can AI help you solve?</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="success_metrics">Success Metrics</Label>
                    <Textarea
                      id="success_metrics"
                      value={context.success_metrics?.join(', ') || ''}
                      onChange={(e) => handleArrayFieldChange('success_metrics', e.target.value.split(', ').filter(Boolean))}
                      placeholder="e.g., Revenue growth, Customer satisfaction, Team productivity"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">How do you measure success?</p>
                  </div>
                </div>
              )}

              {/* Business Context Section */}
              {activeSection === 'business' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="automation_maturity">Automation Level</Label>
                      <Select value={context.automation_maturity || ''} onValueChange={(value) => handleFieldChange('automation_maturity', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Current automation level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None - Manual processes</SelectItem>
                          <SelectItem value="basic">Basic - Some automation</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Moderate automation</SelectItem>
                          <SelectItem value="advanced">Advanced - Highly automated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="success_timeframe">Success Timeline</Label>
                      <Select value={context.success_timeframe || ''} onValueChange={(value) => handleFieldChange('success_timeframe', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Timeline for goals" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1 month">1 month - Immediate results</SelectItem>
                          <SelectItem value="3 months">3 months - Quarterly goals</SelectItem>
                          <SelectItem value="6 months">6 months - Medium term</SelectItem>
                          <SelectItem value="12 months">12 months - Annual goals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key_tools">Key Tools & Systems</Label>
                    <Textarea
                      id="key_tools"
                      value={context.key_tools?.join(', ') || ''}
                      onChange={(e) => handleArrayFieldChange('key_tools', e.target.value.split(', ').filter(Boolean))}
                      placeholder="e.g., Salesforce, HubSpot, Slack, Microsoft"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">What tools do you use daily?</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_priorities">Business Priorities</Label>
                    <Textarea
                      id="business_priorities"
                      value={context.business_priorities?.join(', ') || ''}
                      onChange={(e) => handleArrayFieldChange('business_priorities', e.target.value.split(', ').filter(Boolean))}
                      placeholder="e.g., Revenue growth, Customer retention, Market expansion"
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">What are your company's top priorities?</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4" />
                  Changes are saved automatically
                </div>
                <div className="flex items-center gap-4">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <ButtonSpinner />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}; 