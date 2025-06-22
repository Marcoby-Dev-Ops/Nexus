/**
 * Referral System Component
 * Viral growth engine with gamification, rewards, and social sharing
 * Drives organic growth through incentivized referrals
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  Users,
  Crown,
  Star,
  Trophy,
  Copy,
  CheckCircle2,
  Share2,
  Target,
  ExternalLink,
  Mail,
  MessageCircle,
  Smartphone,
  Bolt,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface ReferralTier {
  id: string;
  name: string;
  icon: React.ComponentType<{ className: string }>;
  minReferrals: number;
  color: string;
  bgColor: string;
  rewards: string[];
  description: string;
}

interface Referral {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'confirmed' | 'converted';
  joinedAt: Date;
  tier: string;
}

interface ReferralStats {
  totalReferrals: number;
  confirmedReferrals: number;
  conversionRate: number;
  currentTier: string;
  nextTierProgress: number;
  positionsClimbed: number;
  estimatedValue: number;
}

const ReferralSystem: React.FC = () => {
  const [referralCode] = useState('NEXUS-VIP-847');
  const [referralLink, setReferralLink] = useState('');
    const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [myReferrals, setMyReferrals] = useState<Referral[]>([]);
  const [stats] = useState<ReferralStats>({
    totalReferrals: 12,
    confirmedReferrals: 8,
    conversionRate: 66.7,
    currentTier: 'vip',
    nextTierProgress: 60,
    positionsClimbed: 24,
    estimatedValue: 2400,
  });

  const referralTiers: ReferralTier[] = [
    {
      id: 'rookie',
      name: 'Rookie Referrer',
      icon: Users,
      minReferrals: 0,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      rewards: ['5% early bird discount', 'Community access'],
      description: 'Welcome to the referral program!'
    },
    {
      id: 'champion',
      name: 'Growth Champion',
      icon: Star,
      minReferrals: 3,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      rewards: ['15% first year discount', 'Priority support', 'Beta access'],
      description: 'Great start! You\'re building momentum.'
    },
    {
      id: 'vip',
      name: 'VIP Advocate',
      icon: Crown,
      minReferrals: 10,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      rewards: ['25% lifetime discount', 'White-label demo', 'Custom onboarding', 'Quarterly check-ins'],
      description: 'Exceptional growth! You\'re a true advocate.'
    },
    {
      id: 'legend',
      name: 'Legendary Influencer',
      icon: Trophy,
      minReferrals: 25,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      rewards: ['50% lifetime discount', 'Revenue sharing', 'Co-marketing opportunities', 'Product input'],
      description: 'Incredible impact! You\'re shaping our community.'
    },
    {
      id: 'founder',
      name: 'Founding Partner',
      icon: Bolt,
      minReferrals: 50,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      rewards: [
        'Free lifetime access',
        'Equity consideration',
        'Advisory board invite',
        'Brand partnership',
      ],
      description: 'Phenomenal! You\'re a true founding partner.',
    },
  ];

  useEffect(() => {
    setReferralLink(`${window.location.origin}/join?ref=${referralCode}`);
  }, [referralCode]);

  useEffect(() => {
    // Mock referral data
    const mockReferrals: Referral[] = [
      {
        id: '1',
        email: 'sarah@techcorp.com',
        name: 'Sarah Chen',
        status: 'confirmed',
        joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tier: 'founder',
      },
      {
        id: '2',
        email: 'mike@startup.io',
        name: 'Mike Johnson',
        status: 'confirmed',
        joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tier: 'vip',
      },
      {
        id: '3',
        email: 'emma@growth.co',
        name: 'Emma Wilson',
        status: 'pending',
        joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tier: 'early-bird',
      },
    ];
    
    setMyReferrals(mockReferrals);
  }, []);

  const getCurrentTier = () => {
    return referralTiers.find(tier => tier.id === stats.currentTier) || referralTiers[0];
  };

  const getNextTier = () => {
    const currentIndex = referralTiers.findIndex(tier => tier.id === stats.currentTier);
    return currentIndex < referralTiers.length - 1 ? referralTiers[currentIndex + 1] : null;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const shareMessages = {
    default: `🚀 I'm part of the Nexus revolution! Join me in the waitlist for the AI-powered business operating system that's changing how companies work. Early access is limited!`,
    personal: `Hey! I wanted to share something exciting with you. I just joined the Nexus waitlist - it's an AI-powered business platform that looks incredible. You should check it out!`,
    professional: `Wanted to share an exciting opportunity: Nexus is launching an AI-powered business operating system with white-label capabilities. The early access program has some amazing benefits.`,
    urgent: `⚡ URGENT: Nexus founder tier closes soon! This AI business platform is going to be huge. I saved you a spot in my referral group - claim it before it's gone!`
  };

  const handleShare = (platform: string, messageType: keyof typeof shareMessages = 'default') => {
    const message = shareMessages[messageType];
    const text = encodeURIComponent(`${message}\n\n${referralLink}`);
    const url = encodeURIComponent(referralLink);
    
    const shareUrls = {
      email: `mailto:?subject=Join me on the Nexus waitlist&body=${text}`,
      sms: `sms:?body=${text}`,
      whatsapp: `https://wa.me/?text=${text}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${encodeURIComponent(message)}`,
    };
    
    if (platform === 'email' || platform === 'sms') {
      window.location.href = shareUrls[platform as keyof typeof shareUrls];
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
    }
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <div className="space-y-6">
      {/* Referral Overview */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-200/20">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <Gift className="w-6 h-6 mr-2 text-secondary" />
            🎁 Referral Rewards
          </CardTitle>
          <p className="text-muted-foreground">
            Share Nexus with your network and unlock exclusive rewards
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Tier */}
            <div className={`p-6 rounded-lg ${currentTier.bgColor} text-center`}>
              <currentTier.icon className={`w-8 h-8 mx-auto mb-3 ${currentTier.color}`} />
              <h3 className="font-bold text-lg mb-2">{currentTier.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{currentTier.description}</p>
              <Badge className={`${currentTier.color.replace('text-', 'bg-')} text-primary-foreground`}>
                Current Tier
              </Badge>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{stats.confirmedReferrals}</div>
                <div className="text-sm text-muted-foreground">Confirmed Referrals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">{stats.positionsClimbed}</div>
                <div className="text-sm text-muted-foreground">Positions Climbed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success">
                  ${stats.estimatedValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimated Referral Value
                </div>
              </div>
            </div>

            {/* Next Tier */}
            {nextTier ? (
              <div className="p-6 rounded-lg bg-muted text-center">
                <nextTier.icon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-bold text-lg mb-2">{nextTier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Refer {nextTier.minReferrals - stats.confirmedReferrals} more
                  to unlock
                </p>
                <div className="flex items-center space-x-2">
                  <Progress
                    value={stats.nextTierProgress}
                    className="w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-lg bg-muted text-center flex flex-col justify-center items-center">
                <Trophy className="w-12 h-12 text-warning mb-4" />
                <h3 className="font-bold text-lg">You're a Legend!</h3>
                <p className="text-sm text-muted-foreground">
                  You've unlocked all available tiers.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Referral Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={copyReferralLink} variant="outline">
                {copiedToClipboard ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button
                onClick={() => handleShare('email')}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                onClick={() => handleShare('sms')}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                SMS
              </Button>
              <Button
                onClick={() => handleShare('whatsapp')}
                variant="outline"
                className="flex items-center justify-center bg-success/5 hover:bg-success/10"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={() => handleShare('twitter')}
                variant="outline"
                className="flex items-center justify-center bg-primary/5 hover:bg-primary/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => handleShare('linkedin')}
                variant="outline"
                className="flex items-center justify-center bg-primary/5 hover:bg-primary/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                LinkedIn
              </Button>
            </div>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Pro Tip:</strong> Personal messages convert 3x better! 
                Mention specific benefits that would appeal to each contact.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            🏆 Tier Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {referralTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isCurrentTier = tier.id === stats.currentTier;
              const isUnlocked = stats.confirmedReferrals >= tier.minReferrals;
              
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrentTier 
                      ? 'border-secondary bg-secondary/5 dark:bg-secondary/20/20' 
                      : isUnlocked
                      ? 'border-success/20 bg-success/5 dark:bg-success/20'
                      : 'border-muted-foreground/20 bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full ${tier.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${tier.color}`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-bold text-lg">{tier.name}</h3>
                          {isCurrentTier && (
                            <Badge className="bg-secondary text-primary-foreground">CURRENT</Badge>
                          )}
                          {isUnlocked && !isCurrentTier && (
                            <Badge className="bg-success text-primary-foreground">UNLOCKED</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                        
                        <div className="space-y-1">
                          {tier.rewards.map((reward, rewardIndex) => (
                            <div key={rewardIndex} className="flex items-center text-sm">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                              <span>{reward}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">{tier.minReferrals}+</div>
                      <div className="text-sm text-muted-foreground">referrals</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* My Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            My Referrals ({myReferrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myReferrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No referrals yet. Start sharing to build your network!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReferrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {referral.name.charAt(0)}
                    </div>
                    
                    <div>
                      <div className="font-medium">{referral.name}</div>
                      <div className="text-sm text-muted-foreground">{referral.email}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge className={
                      referral.tier === 'founder' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-foreground' :
                      referral.tier === 'vip' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground' :
                      'bg-gradient-to-r from-blue-500 to-cyan-500 text-primary-foreground'
                    }>
                      {referral.tier.charAt(0).toUpperCase() + referral.tier.slice(1)}
                    </Badge>
                    
                    <Badge variant={
                      referral.status === 'confirmed' ? 'default' :
                      referral.status === 'converted' ? 'secondary' :
                      'outline'
                    }>
                      {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                    </Badge>
                    
                    <div className="text-sm text-muted-foreground">
                      {referral.joinedAt.toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            💡 Referral Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🎯 Best Practices</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-success" />
                  <span>Share with people who would genuinely benefit from Nexus</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-success" />
                  <span>Explain specific features that match their needs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-success" />
                  <span>Mention the limited-time founder benefits</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-4 h-4 mr-2 mt-0.5 text-success" />
                  <span>Follow up with personal messages</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">🚀 High-Converting Messages</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded border-l-4 border-primary">
                  <div className="font-medium text-sm">For Business Owners:</div>
                  <div className="text-sm text-muted-foreground">
                    "This AI platform could save you 20+ hours/week on operations..."
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded border-l-4 border-success">
                  <div className="font-medium text-sm">For Agencies:</div>
                  <div className="text-sm text-muted-foreground">
                    "White-label opportunity with revenue sharing potential..."
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded border-l-4 border-secondary">
                  <div className="font-medium text-sm">For Tech Leaders:</div>
                  <div className="text-sm text-muted-foreground">
                    "Early access to the future of business automation..."
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralSystem; 