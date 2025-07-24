/**
 * Email Campaigns System
 * Automated email sequences for waitlist nurturing and engagement
 * Milestone announcements, product updates, and conversion optimization
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, Users, BarChart3, Clock, Target, Zap, Edit, Play, Pause, Copy, Eye, TrendingUp, Settings, Download, AlertTriangle, Gift, Rocket, Heart, MessageSquare,  } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';

interface EmailCampaign {
  id: string;
  name: string;
  type: 'welcome' | 'nurture' | 'milestone' | 'launch' | 'referral';
  status: 'draft' | 'active' | 'paused' | 'completed';
  recipients: number;
  sent: number;
  opens: number;
  clicks: number;
  conversions: number;
  subject: string;
  previewText: string;
  scheduledFor?: Date;
  createdAt: Date;
  template: string;
  unsubscribeRate: number;
  growthRate: number;
}

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  emails: EmailCampaign[];
  triggers: string[];
  enrolledCount: number;
  completionRate: number;
  conversionRate: number;
}

interface EmailMetrics {
  totalSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  unsubscribeRate: number;
  growthRate: number;
}

const EmailCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [metrics] = useState<EmailMetrics>({
    totalSent: 8429,
    openRate: 68.4,
    clickRate: 12.7,
    conversionRate: 4.2,
    unsubscribeRate: 0.8,
    growthRate: 15.3,
  });
  
  const [selectedTab, setSelectedTab] = useState<
    'campaigns' | 'sequences' | 'templates'
  >('campaigns');
  // const [showCampaignModal, setShowCampaignModal] = useState(false);
  // const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(
  //   null
  // );

  useEffect(() => {
    // Mock campaign data
    const mockCampaigns: EmailCampaign[] = [
      {
        id: '1',
        name: 'Welcome to the Revolution',
        type: 'welcome',
        status: 'active',
        recipients: 2847,
        sent: 2847,
        opens: 1947,
        clicks: 361,
        conversions: 120,
        subject: '🚀 Welcome to Nexus - Your Journey Begins!',
        previewText: 'Thanks for joining the waitlist! Here\'s what happens next...',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        template: 'welcome-series',
        unsubscribeRate: 0.8,
        growthRate: 15.3,
      },
      {
        id: '2',
        name: 'Founder Tier Closing Soon',
        type: 'milestone',
        status: 'active',
        recipients: 847,
        sent: 847,
        opens: 623,
        clicks: 156,
        conversions: 67,
        subject: '⚡ URGENT: Only 11 Founder spots left!',
        previewText: 'The founder tier closes at 100 members. Secure your spot now...',
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        template: 'urgency-milestone',
        unsubscribeRate: 0.8,
        growthRate: 15.3,
      },
      {
        id: '3',
        name: 'Behind the Scenes Update',
        type: 'nurture',
        status: 'draft',
        recipients: 2847,
        sent: 0,
        opens: 0,
        clicks: 0,
        conversions: 0,
        subject: '🔥 Exclusive: See Nexus in Action',
        previewText: 'Get an exclusive behind-the-scenes look at what we\'re building...',
        createdAt: new Date(),
        template: 'product-update',
        unsubscribeRate: 0.8,
        growthRate: 15.3,
      },
      {
        id: '4',
        name: 'Referral Rewards Program',
        type: 'referral',
        status: 'active',
        recipients: 456,
        sent: 456,
        opens: 298,
        clicks: 89,
        conversions: 34,
        subject: '🎁 Earn rewards by sharing Nexus',
        previewText: 'Your referral link is ready! Start earning exclusive benefits...',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        template: 'referral-program',
        unsubscribeRate: 0.8,
        growthRate: 15.3,
      }
    ];

    const mockSequences: EmailSequence[] = [
      {
        id: '1',
        name: 'Waitlist Onboarding',
        description: 'Welcome new members and build excitement',
        emails: mockCampaigns.filter(c => c.type === 'welcome'),
        triggers: ['waitlist_signup'],
        enrolledCount: 2847,
        completionRate: 78.4,
        conversionRate: 12.3
      },
      {
        id: '2',
        name: 'Milestone Celebrations',
        description: 'Announce achievements and create urgency',
        emails: mockCampaigns.filter(c => c.type === 'milestone'),
        triggers: ['milestone_reached', 'tier_closing'],
        enrolledCount: 1247,
        completionRate: 65.7,
        conversionRate: 8.9
      },
      {
        id: '3',
        name: 'Product Education',
        description: 'Educate about features and benefits',
        emails: mockCampaigns.filter(c => c.type === 'nurture'),
        triggers: ['week_2', 'week_4', 'week_6'],
        enrolledCount: 2156,
        completionRate: 56.2,
        conversionRate: 6.8
      }
    ];

    setCampaigns(mockCampaigns);
    setSequences(mockSequences);
  }, []);

  const emailTemplates = [
    {
      id: 'welcome-series',
      name: 'Welcome Series',
      description: 'Warm welcome with next steps and expectations',
      type: 'welcome',
      preview: '🚀 Welcome to the future of business operations...',
      performance: { opens: 72.3, clicks: 15.8, conversions: 8.2 }
    },
    {
      id: 'urgency-milestone',
      name: 'Urgency & Milestones',
      description: 'Create urgency around limited spots and achievements',
      type: 'milestone',
      preview: '⚡ Only X spots remaining in the founder tier...',
      performance: { opens: 81.7, clicks: 18.4, conversions: 12.1 }
    },
    {
      id: 'product-update',
      name: 'Product Updates',
      description: 'Share development progress and feature previews',
      type: 'nurture',
      preview: '🔥 Exclusive preview: See what we\'re building...',
      performance: { opens: 68.9, clicks: 12.3, conversions: 5.7 }
    },
    {
      id: 'referral-program',
      name: 'Referral Program',
      description: 'Promote referral benefits and share tools',
      type: 'referral',
      preview: '🎁 Earn exclusive rewards by inviting friends...',
      performance: { opens: 65.4, clicks: 19.6, conversions: 14.3 }
    },
    {
      id: 'launch-countdown',
      name: 'Launch Countdown',
      description: 'Build excitement for product launch',
      type: 'launch',
      preview: '⏰ T-minus 7 days until Nexus launches...',
      performance: { opens: 89.2, clicks: 24.7, conversions: 18.9 }
    }
  ];

  const getCampaignIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <Heart className="w-4 h-4" />;
      case 'milestone': return <Trophy className="w-4 h-4" />;
      case 'nurture': return <MessageSquare className="w-4 h-4" />;
      case 'launch': return <Rocket className="w-4 h-4" />;
      case 'referral': return <Gift className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'draft': return 'bg-muted text-foreground';
      case 'paused': return 'bg-warning/10 text-warning/80';
      case 'completed': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-foreground';
    }
  };

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0;
    return parseFloat(((numerator / denominator) * 100).toFixed(1));
  };

  const handleCampaignAction = (
    campaignId: string,
    action: 'edit' | 'duplicate' | 'pause' | 'resume' | 'delete'
  ) => {
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.log(`Action: ${action} on campaign ${campaignId}`);
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    switch (action) {
      case 'edit':
        // setSelectedCampaign(campaign);
        // setShowCampaignModal(true);
        break;
      case 'duplicate':
        const newCampaign: EmailCampaign = {
          ...campaign,
          id: Date.now().toString(),
          name: `${campaign.name} (Copy)`,
          status: 'draft' as const,
          unsubscribeRate: 0.8,
          growthRate: 15.3,
        };
        setCampaigns(prev => [...prev, newCampaign]);
        break;
      case 'pause':
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'paused' } : c));
        break;
      case 'resume':
        setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'active' } : c));
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this campaign?')) {
          setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        }
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">Nurture your waitlist and drive conversions</p>
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => { /* setShowCampaignModal(true) */ }}>
            <Mail className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          {
            title: 'Total Sent',
            value: metrics.totalSent.toLocaleString(),
            change: `+${metrics.growthRate}%`,
            icon: <Send className="w-5 h-5" />,
            color: 'text-primary'
          },
          {
            title: 'Open Rate',
            value: `${metrics.openRate}%`,
            change: '+2.3%',
            icon: <Eye className="w-5 h-5" />,
            color: 'text-success'
          },
          {
            title: 'Click Rate',
            value: `${metrics.clickRate}%`,
            change: '+1.8%',
            icon: <Target className="w-5 h-5" />,
            color: 'text-secondary'
          },
          {
            title: 'Conversion Rate',
            value: `${metrics.conversionRate}%`,
            change: '+0.9%',
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-warning'
          },
          {
            title: 'Unsubscribe Rate',
            value: `${metrics.unsubscribeRate}%`,
            change: '-0.2%',
            icon: <AlertTriangle className="w-5 h-5" />,
            color: 'text-destructive'
          },
          {
            title: 'List Growth',
            value: `+${metrics.growthRate}%`,
            change: '+3.1%',
            icon: <Users className="w-5 h-5" />,
            color: 'text-cyan-600'
          }
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{metric.title}</p>
                    <p className="text-xl font-bold">{metric.value}</p>
                    <p className="text-sm text-success">{metric.change}</p>
                  </div>
                  <div className={`${metric.color}`}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Mail },
          { id: 'sequences', label: 'Sequences', icon: Zap },
          { id: 'templates', label: 'Templates', icon: Copy }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab.id as any)}
              className="flex items-center"
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'campaigns' && (
          <motion.div
            key="campaigns"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Campaigns ({campaigns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign, index) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {getCampaignIcon(campaign.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>{campaign.recipients} recipients</span>
                            {campaign.sent > 0 && (
                              <>
                                <span>•</span>
                                <span>{calculateRate(campaign.opens, campaign.sent)}% open rate</span>
                                <span>•</span>
                                <span>{calculateRate(campaign.clicks, campaign.sent)}% click rate</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {campaign.scheduledFor && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            Scheduled
                          </Badge>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleCampaignAction(campaign.id, 'edit'); }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleCampaignAction(campaign.id, campaign.status === 'active' ? 'pause' : 'resume'); }}
                        >
                          {campaign.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedTab === 'sequences' && (
          <motion.div
            key="sequences"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Email Sequences ({sequences.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {sequences.map((sequence, index) => (
                    <motion.div
                      key={sequence.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{sequence.name}</h3>
                          <p className="text-muted-foreground">{sequence.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{sequence.enrolledCount}</div>
                          <div className="text-sm text-muted-foreground">enrolled</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{sequence.emails.length}</div>
                          <div className="text-sm text-muted-foreground">Emails</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{sequence.completionRate}%</div>
                          <div className="text-sm text-muted-foreground">Completion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{sequence.conversionRate}%</div>
                          <div className="text-sm text-muted-foreground">Conversion</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{sequence.triggers.length}</div>
                          <div className="text-sm text-muted-foreground">Triggers</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {sequence.triggers.map((trigger, triggerIndex) => (
                            <Badge key={triggerIndex} variant="outline" className="text-xs">
                              {trigger.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Copy className="w-5 h-5 mr-2" />
                  Email Templates ({emailTemplates.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md: grid-cols-2 gap-6">
                  {emailTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            {getCampaignIcon(template.type)}
                            <h3 className="font-semibold">{template.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                          <div className="p-4 bg-muted/50 rounded border-l-4 border-secondary">
                            <p className="text-sm italic">{template.preview}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-success">{template.performance.opens}%</div>
                          <div className="text-xs text-muted-foreground">Opens</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">{template.performance.clicks}%</div>
                          <div className="text-xs text-muted-foreground">Clicks</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-secondary">{template.performance.conversions}%</div>
                          <div className="text-xs text-muted-foreground">Converts</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1">
                          <Copy className="w-4 h-4 mr-2" />
                          Use Template
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailCampaigns; 