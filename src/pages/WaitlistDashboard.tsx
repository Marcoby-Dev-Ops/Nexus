/**
 * Waitlist Dashboard
 * Comprehensive admin dashboard for managing the Nexus pre-order campaign
 * Combines waitlist management, hype building, referral tracking, and email campaigns
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Mail,
  Share2,
  Gift,
  BarChart3,
  Settings,
  Zap,
  Target,
  Crown,
  Star,
  Globe,
  Calendar,
  DollarSign,
  Flame,
  Rocket,
  Heart,
  MessageCircle,
  Trophy,
  Clock,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import WaitlistManager from '@/components/waitlist/WaitlistManager';
import HypeBuilder from '@/components/hype/HypeBuilder';
import ReferralSystem from '@/components/waitlist/ReferralSystem';
import EmailCampaigns from '@/components/waitlist/EmailCampaigns';

interface DashboardMetrics {
  totalSignups: number;
  dailyGrowthRate: number;
  totalShares: number;
  referralRate: number;
  emailOpenRate: number;
  conversionRate: number;
  revenuePotential: number;
  socialMentions: number;
  avgPositionClimbed: number;
  viralCoefficient: number;
}

interface RecentActivity {
  id: string;
  type: 'signup' | 'referral' | 'share' | 'conversion' | 'milestone';
  description: string;
  timestamp: Date;
  value?: number;
  icon: React.ComponentType<any>;
}

const WaitlistDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'waitlist' | 'hype' | 'referrals' | 'emails'>('overview');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  const metrics: DashboardMetrics = {
    totalSignups: 2847,
    dailyGrowthRate: 8.5,
    totalShares: 4521,
    referralRate: 34.2,
    emailOpenRate: 68.4,
    conversionRate: 12.3,
    revenuePotential: 847200,
    socialMentions: 1234,
    avgPositionClimbed: 15.7,
    viralCoefficient: 1.34
  };

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'milestone',
      description: 'Reached 2,500 waitlist members milestone!',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      value: 2500,
      icon: Trophy
    },
    {
      id: '2',
      type: 'referral',
      description: 'Sarah Chen completed 5 referrals, upgraded to VIP tier',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      value: 5,
      icon: Gift
    },
    {
      id: '3',
      type: 'share',
      description: 'Viral spike: 47 shares in the last hour',
      timestamp: new Date(Date.now() - 23 * 60 * 1000),
      value: 47,
      icon: Share2
    },
    {
      id: '4',
      type: 'signup',
      description: 'Mike Johnson from TechCorp joined founder tier',
      timestamp: new Date(Date.now() - 35 * 60 * 1000),
      icon: Crown
    },
    {
      id: '5',
      type: 'conversion',
      description: 'Email campaign "Founder Tier Closing" achieved 18.4% conversion',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      value: 18.4,
      icon: Mail
    }
  ];

  const upcomingMilestones = [
    { target: 3000, current: 2847, name: 'Diamond Tier Unlock', reward: 'Exclusive features access', progress: 94.9 },
    { target: 5000, current: 2847, name: 'Legendary Status', reward: 'Lifetime benefits', progress: 56.9 },
    { target: 10000, current: 2847, name: 'Global Recognition', reward: 'Industry spotlight', progress: 28.5 }
  ];

  const campaignPerformance = [
    { name: 'Welcome Series', sent: 2847, opens: 72.3, clicks: 15.8, conversions: 8.2 },
    { name: 'Referral Program', sent: 1234, opens: 65.4, clicks: 19.6, conversions: 14.3 },
    { name: 'Milestone Alerts', sent: 847, opens: 81.7, clicks: 18.4, conversions: 12.1 },
    { name: 'Product Updates', sent: 2156, opens: 68.9, clicks: 12.3, conversions: 5.7 }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup': return Crown;
      case 'referral': return Gift;
      case 'share': return Share2;
      case 'conversion': return Mail;
      case 'milestone': return Trophy;
      default: return Star;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signup': return 'text-blue-600';
      case 'referral': return 'text-purple-600';
      case 'share': return 'text-green-600';
      case 'conversion': return 'text-orange-600';
      case 'milestone': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🚀 Nexus Launch Campaign</h1>
          <p className="text-muted-foreground">Pre-order waitlist and hype management dashboard</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Campaign Settings
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'waitlist', label: 'Waitlist', icon: Users },
          { id: 'hype', label: 'Hype Builder', icon: Flame },
          { id: 'referrals', label: 'Referrals', icon: Gift },
          { id: 'emails', label: 'Email Campaigns', icon: Mail }
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
        {selectedTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Signups',
                  value: metrics.totalSignups.toLocaleString(),
                  change: `+${metrics.dailyGrowthRate}%`,
                  icon: <Users className="w-6 h-6" />,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-100'
                },
                {
                  title: 'Revenue Potential',
                  value: `$${(metrics.revenuePotential / 1000).toFixed(0)}K`,
                  change: `+${metrics.conversionRate}%`,
                  icon: <DollarSign className="w-6 h-6" />,
                  color: 'text-green-600',
                  bgColor: 'bg-green-100'
                },
                {
                  title: 'Viral Coefficient',
                  value: metrics.viralCoefficient.toFixed(2),
                  change: `+${metrics.referralRate}%`,
                  icon: <Share2 className="w-6 h-6" />,
                  color: 'text-purple-600',
                  bgColor: 'bg-purple-100'
                },
                {
                  title: 'Email Engagement',
                  value: `${metrics.emailOpenRate}%`,
                  change: `+${metrics.conversionRate}%`,
                  icon: <Mail className="w-6 h-6" />,
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-100'
                }
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">{metric.title}</p>
                          <p className="text-2xl font-bold mb-1">{metric.value}</p>
                          <p className="text-sm text-green-600 flex items-center">
                            <ArrowUp className="w-3 h-3 mr-1" />
                            {metric.change}
                          </p>
                        </div>
                        <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                          <div className={metric.color}>
                            {metric.icon}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Upcoming Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    🎯 Upcoming Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingMilestones.map((milestone, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{milestone.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {milestone.current} / {milestone.target}
                          </span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{milestone.reward}</span>
                          <span className="font-medium">{milestone.progress.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    🌊 Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center ${getActivityColor(activity.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{activity.description}</p>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                          </div>
                          {activity.value && (
                            <Badge variant="outline" className="text-xs">
                              {activity.type === 'conversion' ? `${activity.value}%` : activity.value}
                            </Badge>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  📧 Email Campaign Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignPerformance.map((campaign, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{campaign.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{campaign.sent} sent</span>
                          <span>•</span>
                          <span>{campaign.opens}% opens</span>
                          <span>•</span>
                          <span>{campaign.clicks}% clicks</span>
                          <span>•</span>
                          <span>{campaign.conversions}% conversions</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">{campaign.conversions}%</div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {selectedTab === 'waitlist' && (
          <motion.div
            key="waitlist"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <WaitlistManager />
          </motion.div>
        )}

        {selectedTab === 'hype' && (
          <motion.div
            key="hype"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <HypeBuilder />
          </motion.div>
        )}

        {selectedTab === 'referrals' && (
          <motion.div
            key="referrals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ReferralSystem />
          </motion.div>
        )}

        {selectedTab === 'emails' && (
          <motion.div
            key="emails"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EmailCampaigns />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaitlistDashboard; 