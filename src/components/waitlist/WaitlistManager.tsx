/**
 * Waitlist Management System
 * Admin dashboard for managing pre-order waitlist and hype campaigns
 * Tracks signups, referrals, engagement metrics, and conversion funnel
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Mail,
  Share2,
  Gift,
  Target,
  BarChart3,
  Download,
  Filter,
  Search,
  Crown,
  Star,
  Clock,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Calendar,
  MessageSquare,
  DollarSign,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string;
  company?: string;
  position: number;
  tier: 'founder' | 'vip' | 'early-bird';
  joinedAt: Date;
  referrals: number;
  referredBy?: string;
  source: 'direct' | 'social' | 'referral' | 'paid';
  country: string;
  status: 'active' | 'converted' | 'churned';
  engagementScore: number;
}

interface DashboardMetrics {
  totalSignups: number;
  dailyGrowthRate: number;
  conversionRate: number;
  referralRate: number;
  avgReferralsPerUser: number;
  topReferrers: number;
  socialShares: number;
  emailOpenRate: number;
  totalRevenuePotential: number;
}

interface CampaignData {
  name: string;
  signups: number;
  conversions: number;
  revenue: number;
  roi: number;
}

const WaitlistManager: React.FC = () => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSignups: 2847,
    dailyGrowthRate: 8.5,
    conversionRate: 12.3,
    referralRate: 34.2,
    avgReferralsPerUser: 2.8,
    topReferrers: 47,
    socialShares: 1234,
    emailOpenRate: 68.4,
    totalRevenuePotential: 847200
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'position' | 'referrals' | 'joinedAt'>('position');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  // Mock waitlist data
  useEffect(() => {
    const mockEntries: WaitlistEntry[] = Array.from({ length: 50 }, (_, i) => ({
      id: `entry-${i + 1}`,
      email: `user${i + 1}@company${Math.floor(Math.random() * 100)}.com`,
      firstName: ['Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'John', 'Kate'][Math.floor(Math.random() * 8)],
      company: ['TechCorp', 'StartupLab', 'InnovateCo', 'GrowthInc', 'ScaleTech'][Math.floor(Math.random() * 5)],
      position: i + 1,
      tier: i < 5 ? 'founder' : i < 25 ? 'vip' : 'early-bird',
      joinedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      referrals: Math.floor(Math.random() * 15),
      referredBy: Math.random() > 0.7 ? `ref-${Math.floor(Math.random() * 100)}` : undefined,
      source: ['direct', 'social', 'referral', 'paid'][Math.floor(Math.random() * 4)] as any,
      country: ['US', 'CA', 'UK', 'DE', 'FR', 'AU'][Math.floor(Math.random() * 6)],
      status: ['active', 'converted', 'churned'][Math.floor(Math.random() * 3)] as any,
      engagementScore: Math.floor(Math.random() * 100)
    }));
    
    setWaitlistEntries(mockEntries);
  }, []);

  const campaigns: CampaignData[] = [
    { name: 'Social Media Blitz', signups: 847, conversions: 104, revenue: 52000, roi: 340 },
    { name: 'Referral Program', signups: 1234, conversions: 189, revenue: 94500, roi: 780 },
    { name: 'Email Campaign', signups: 456, conversions: 67, revenue: 33500, roi: 220 },
    { name: 'Influencer Partnerships', signups: 623, conversions: 82, revenue: 41000, roi: 180 }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'founder': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'vip': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'early-bird': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default: return 'bg-gray-500';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'social': return <Share2 className="w-4 h-4" />;
      case 'referral': return <Gift className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const filteredEntries = waitlistEntries
    .filter(entry => {
      const matchesSearch = entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = selectedTier === 'all' || entry.tier === selectedTier;
      return matchesSearch && matchesTier;
    })
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'position': return (a.position - b.position) * modifier;
        case 'referrals': return (a.referrals - b.referrals) * modifier;
        case 'joinedAt': return (a.joinedAt.getTime() - b.joinedAt.getTime()) * modifier;
        default: return 0;
      }
    });

  const handleExport = (format: 'csv' | 'json') => {
    const data = selectedEntries.length > 0 
      ? waitlistEntries.filter(entry => selectedEntries.includes(entry.id))
      : waitlistEntries;
    
    if (format === 'csv') {
      const csv = [
        'Position,Email,Name,Company,Tier,Referrals,Joined,Source,Country,Status',
        ...data.map(entry => [
          entry.position,
          entry.email,
          entry.firstName,
          entry.company || '',
          entry.tier,
          entry.referrals,
          entry.joinedAt.toISOString().split('T')[0],
          entry.source,
          entry.country,
          entry.status
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus-waitlist.csv';
      a.click();
    } else {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus-waitlist.json';
      a.click();
    }
    
    setShowExportModal(false);
  };

  const sendBulkEmail = () => {
    const recipients = selectedEntries.length > 0 
      ? selectedEntries.length 
      : waitlistEntries.length;
    
    alert(`Bulk email sent to ${recipients} waitlist members!`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waitlist Command Center</h1>
          <p className="text-muted-foreground">Manage your Nexus pre-order campaign</p>
        </div>
        
        <div className="flex gap-4">
          <Button onClick={() => setShowExportModal(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
          <Button onClick={sendBulkEmail} className="bg-purple-600 hover:bg-purple-700">
            <Mail className="w-4 h-4 mr-2" />
            Send Update
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Signups',
            value: metrics.totalSignups.toLocaleString(),
            change: `+${metrics.dailyGrowthRate}%`,
            icon: <Users className="w-6 h-6" />,
            color: 'text-blue-600'
          },
          {
            title: 'Revenue Potential',
            value: `$${(metrics.totalRevenuePotential / 1000).toFixed(0)}K`,
            change: `+${metrics.conversionRate}%`,
            icon: <DollarSign className="w-6 h-6" />,
            color: 'text-green-600'
          },
          {
            title: 'Referral Rate',
            value: `${metrics.referralRate}%`,
            change: `+${metrics.avgReferralsPerUser}`,
            icon: <Gift className="w-6 h-6" />,
            color: 'text-purple-600'
          },
          {
            title: 'Engagement',
            value: `${metrics.emailOpenRate}%`,
            change: `+${metrics.socialShares}`,
            icon: <TrendingUp className="w-6 h-6" />,
            color: 'text-orange-600'
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
                    <p className="text-muted-foreground text-sm">{metric.title}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-green-600 flex items-center">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      {metric.change}
                    </p>
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

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Campaign Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{campaign.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{campaign.signups} signups</span>
                    <span>{campaign.conversions} conversions</span>
                    <span>${campaign.revenue.toLocaleString()} revenue</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">{campaign.roi}% ROI</div>
                  <div className="text-sm text-muted-foreground">Return on Investment</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Waitlist Members ({filteredEntries.length})
            </CardTitle>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              {/* Tier Filter */}
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="all">All Tiers</option>
                <option value="founder">Founder</option>
                <option value="vip">VIP</option>
                <option value="early-bird">Early Bird</option>
              </select>
              
              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="position-asc">Position (Low to High)</option>
                <option value="position-desc">Position (High to Low)</option>
                <option value="referrals-desc">Most Referrals</option>
                <option value="joinedAt-desc">Newest First</option>
                <option value="joinedAt-asc">Oldest First</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {selectedEntries.length > 0 && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {selectedEntries.length} members selected. 
                <Button variant="outline" size="sm" className="ml-2" onClick={sendBulkEmail}>
                  Send Email
                </Button>
                <Button variant="outline" size="sm" className="ml-2" onClick={() => setSelectedEntries([])}>
                  Clear Selection
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            {filteredEntries.slice(0, 20).map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  selectedEntries.includes(entry.id) ? 'bg-primary/10 border-primary' : 'bg-background'
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedEntries.includes(entry.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntries(prev => [...prev, entry.id]);
                      } else {
                        setSelectedEntries(prev => prev.filter(id => id !== entry.id));
                      }
                    }}
                    className="rounded"
                  />
                  
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-bold">#{entry.position}</div>
                    <Badge className={`text-xs ${getTierColor(entry.tier)} text-white`}>
                      {entry.tier}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-semibold">{entry.firstName}</div>
                    <div className="text-sm text-muted-foreground">{entry.email}</div>
                    {entry.company && (
                      <div className="text-sm text-muted-foreground">{entry.company}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-lg font-bold">{entry.referrals}</div>
                    <div className="text-xs text-muted-foreground">Referrals</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center text-sm">
                      {getSourceIcon(entry.source)}
                      <span className="ml-1 capitalize">{entry.source}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{entry.country}</div>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant={entry.status === 'active' ? 'default' : entry.status === 'converted' ? 'secondary' : 'outline'}>
                      {entry.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {entry.joinedAt.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredEntries.length > 20 && (
            <div className="text-center mt-6">
              <Button variant="outline">
                Load More ({filteredEntries.length - 20} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80]"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background p-6 rounded-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">Export Waitlist Data</h2>
              <p className="text-muted-foreground mb-6">
                Choose format to export {selectedEntries.length > 0 ? selectedEntries.length : waitlistEntries.length} records
              </p>
              
              <div className="space-y-4">
                <Button 
                  onClick={() => handleExport('csv')} 
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
                <Button 
                  onClick={() => handleExport('json')} 
                  className="w-full"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as JSON
                </Button>
              </div>
              
              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => setShowExportModal(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WaitlistManager; 