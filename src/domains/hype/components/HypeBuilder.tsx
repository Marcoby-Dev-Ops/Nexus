/**
 * Hype Builder System
 * Viral marketing components to build momentum and excitement
 * Social sharing, live counters, milestone celebrations, and viral loops
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  Users,
  Flame,
  Zap,
  Trophy,
  Target,
  TrendingUp,
  Heart,
  MessageCircle,
  ArrowUp,
  Gift,
  Crown,
  Rocket,
  CheckCircle2,
  ExternalLink,
  Volume2,
  VolumeX,
  Star,
  Sparkles,
  Bolt,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';

interface ShareWidget {
  platform: string;
  icon: React.ComponentType<any>;
  color: string;
  shares: number;
  growth: number;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  unlocked: boolean;
  celebrated: boolean;
}

interface ViralContent {
  id: string;
  type: 'image' | 'video' | 'gif';
  title: string;
  description: string;
  url: string;
  shares: number;
  engagement: number;
}

const HypeBuilder: React.FC = () => {
  const [totalSignups, setTotalSignups] = useState(2847);
  const [totalShares, setTotalShares] = useState(4521);
  const [isLiveCounterEnabled, setIsLiveCounterEnabled] = useState(true);
  const [selectedShareContent, setSelectedShareContent] = useState(0);
  const [showMilestoneAlert, setShowMilestoneAlert] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const shareWidgets: ShareWidget[] = [
    {
      platform: 'Twitter',
      icon: Twitter,
      color: 'bg-blue-400 hover:bg-primary',
      shares: 1247,
      growth: 12.4
    },
    {
      platform: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-primary hover:bg-primary/90',
      shares: 892,
      growth: 18.7
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      color: 'bg-primary/80 hover:bg-primary/20',
      shares: 634,
      growth: 9.2
    }
  ];

  const milestones: Milestone[] = [
    {
      id: '1',
      title: '🎯 First Hundred',
      description: 'First 100 founder members',
      target: 100,
      current: 89,
      reward: 'Exclusive founder NFT + 75% lifetime discount',
      unlocked: false,
      celebrated: false
    },
    {
      id: '2',
      title: '🚀 Launch Velocity',
      description: '500 early adopters secured',
      target: 500,
      current: 423,
      reward: 'VIP early access + 50% first year discount',
      unlocked: false,
      celebrated: false
    },
    {
      id: '3',
      title: '🌟 Viral Moment',
      description: '1000 community members',
      target: 1000,
      current: 847,
      reward: 'Community badge + priority support',
      unlocked: false,
      celebrated: false
    },
    {
      id: '4',
      title: '💎 Diamond Status',
      description: '2500 pre-orders locked in',
      target: 2500,
      current: 2401,
      reward: 'Diamond tier access + exclusive features',
      unlocked: false,
      celebrated: false
    },
    {
      id: '5',
      title: '🏆 Legendary Launch',
      description: '5000 waitlist members',
      target: 5000,
      current: totalSignups,
      reward: 'Legendary status + lifetime benefits',
      unlocked: false,
      celebrated: false
    }
  ];

  const viralContent: ViralContent[] = [
    {
      id: '1',
      type: 'image',
      title: 'Nexus vs Traditional Business Tools',
      description: 'Comparison infographic showing the power of unified business operations',
      url: '/assets/nexus-comparison.png',
      shares: 892,
      engagement: 94.2
    },
    {
      id: '2',
      type: 'gif',
      title: 'AI Automation in Action',
      description: 'Watch how Nexus automates complex business workflows in seconds',
      url: '/assets/nexus-automation.gif',
      shares: 1247,
      engagement: 97.8
    },
    {
      id: '3',
      type: 'video',
      title: 'Behind the Scenes: Building the Future',
      description: 'Exclusive look at the team building the next generation business OS',
      url: '/assets/nexus-bts.mp4',
      shares: 2156,
      engagement: 89.3
    }
  ];

  // Live counter animation
  useEffect(() => {
    if (!isLiveCounterEnabled) return;

    const interval = setInterval(() => {
      const growthRate = 0.1 + Math.random() * 0.3; // 0.1% to 0.4% growth
      setTotalSignups(prev => Math.floor(prev * (1 + growthRate / 100)));
      setTotalShares(prev => Math.floor(prev * (1 + (growthRate * 1.5) / 100)));
    }, 8000 + Math.random() * 12000); // Random interval 8-20 seconds

    return () => clearInterval(interval);
  }, [isLiveCounterEnabled]);

  // Milestone checker
  useEffect(() => {
    milestones.forEach(milestone => {
      if (!milestone.celebrated && totalSignups >= milestone.target) {
        milestone.unlocked = true;
        setShowMilestoneAlert(true);
        
        if (soundEnabled) {
          // Play celebration sound
          const audio = new Audio('/sounds/milestone-celebration.mp3');
          audio.play().catch(() => {}); // Ignore errors if sound doesn't load
        }
        
        setTimeout(() => {
          milestone.celebrated = true;
          setShowMilestoneAlert(false);
        }, 5000);
      }
    });
  }, [totalSignups, soundEnabled]);

  const shareContent = viralContent[selectedShareContent];

  const generateShareText = (platform: string) => {
    const baseTexts = [
      `🚀 The future of business is here! I just secured my spot on the Nexus waitlist. This AI-powered business OS is going to change everything.`,
      `💡 Just joined the revolution! Nexus is building the world's first truly intelligent business operating system. Early access is limited!`,
      `🔥 This is huge! Nexus combines AI, automation, and analytics into one powerful platform. I'm in the founder tier - you should be too!`,
      `⚡ Game changer alert! Nexus is the business platform we've all been waiting for. Join me in shaping the future of work.`
    ];
    
    const text = baseTexts[Math.floor(Math.random() * baseTexts.length)];
    const hashtags = '#Nexus #AI #BusinessAutomation #FutureOfWork #Startup';
    
    return `${text} ${hashtags}`;
  };

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(generateShareText(platform));
    const url = encodeURIComponent(window.location.origin);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
    
    // Simulate share count increase
    setTotalShares(prev => prev + 1);
  };

  const copyShareLink = () => {
    const shareText = generateShareText('generic');
    const shareUrl = window.location.origin;
    const fullText = `${shareText}\n\n${shareUrl}`;
    
    navigator.clipboard.writeText(fullText);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const getNextMilestone = () => {
    return milestones.find(m => !m.unlocked && totalSignups < m.target);
  };

  const nextMilestone = getNextMilestone();

  return (
    <div className="space-y-6">
      {/* Milestone Achievement Alert */}
      <AnimatePresence>
        {showMilestoneAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Alert className="bg-gradient-to-r from-yellow-400 to-orange-500 text-foreground border-none shadow-2xl">
              <Trophy className="h-5 w-5" />
              <AlertDescription className="font-bold text-lg">
                🎉 Milestone Unlocked! Amazing community growth!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Stats Dashboard */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-200/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-2xl">
              <Flame className="w-6 h-6 mr-2 text-warning" />
              🔥 Hype Meter
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Badge className="bg-success text-primary-foreground animate-pulse">
                🔴 LIVE
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Signups */}
            <motion.div
              key={totalSignups}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3 }}
              className="text-center p-6 bg-card/10 rounded-lg backdrop-blur"
            >
              <div className="text-4xl font-bold text-primary-foreground mb-2">
                {totalSignups.toLocaleString()}
              </div>
              <div className="text-primary-foreground/80 mb-2">Waitlist Members</div>
              <div className="flex items-center justify-center text-success">
                <ArrowUp className="w-4 h-4 mr-1" />
                <span className="text-sm">Live Growth</span>
              </div>
            </motion.div>

            {/* Total Shares */}
            <motion.div
              key={totalShares}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.3 }}
              className="text-center p-6 bg-card/10 rounded-lg backdrop-blur"
            >
              <div className="text-4xl font-bold text-primary-foreground mb-2">
                {totalShares.toLocaleString()}
              </div>
              <div className="text-primary-foreground/80 mb-2">Social Shares</div>
              <div className="flex items-center justify-center text-primary">
                <Share2 className="w-4 h-4 mr-1" />
                <span className="text-sm">Viral Growth</span>
              </div>
            </motion.div>

            {/* Hype Score */}
            <div className="text-center p-6 bg-card/10 rounded-lg backdrop-blur">
              <div className="text-4xl font-bold text-primary-foreground mb-2">
                {Math.floor((totalSignups + totalShares) / 100)}%
              </div>
              <div className="text-primary-foreground/80 mb-2">Hype Score</div>
              <div className="flex items-center justify-center text-secondary">
                                  <Bolt className="w-4 h-4 mr-1" />
                <span className="text-sm">Momentum</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Milestone Progress */}
      {nextMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Next Milestone: {nextMilestone.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{nextMilestone.description}</span>
                <span className="font-bold">
                  {totalSignups} / {nextMilestone.target}
                </span>
              </div>
              
              <Progress 
                value={(totalSignups / nextMilestone.target) * 100} 
                className="h-3"
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {nextMilestone.target - totalSignups} members to go
                </span>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-primary-foreground">
                  🎁 {nextMilestone.reward}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Social Sharing Hub */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            🚀 Spread the Word
          </CardTitle>
          <p className="text-muted-foreground">
            Help us reach the next milestone! Share the excitement and earn rewards.
          </p>
        </CardHeader>
        <CardContent>
          {/* Viral Content Selector */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Choose what to share:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {viralContent.map((content, index) => (
                <motion.div
                  key={content.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedShareContent === index 
                      ? 'border-secondary bg-secondary/5 dark:bg-secondary/20/20' 
                      : 'border-border hover:border-purple-300'
                  }`}
                  onClick={() => setSelectedShareContent(index)}
                >
                  <div className="flex items-center mb-2">
                    {content.type === 'image' && <Star className="w-4 h-4 mr-2 text-warning" />}
                    {content.type === 'gif' && <Zap className="w-4 h-4 mr-2 text-primary" />}
                    {content.type === 'video' && <Rocket className="w-4 h-4 mr-2 text-destructive" />}
                    <span className="font-medium">{content.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{content.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-success">{content.shares} shares</span>
                    <span className="text-primary">{content.engagement}% engagement</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {shareWidgets.map((widget) => {
              const Icon = widget.icon;
              return (
                <motion.div key={widget.platform} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => handleShare(widget.platform.toLowerCase())}
                    className={`w-full ${widget.color} text-primary-foreground`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {widget.platform}
                  </Button>
                  <div className="text-center mt-2">
                    <div className="text-sm font-semibold">{widget.shares}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center">
                      <ArrowUp className="w-3 h-3 mr-1 text-success" />
                      +{widget.growth}%
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={copyShareLink}
                variant="outline"
                className="w-full"
              >
                {copiedToClipboard ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                Copy Link
              </Button>
              <div className="text-center mt-2">
                <div className="text-sm font-semibold">Custom</div>
                <div className="text-xs text-muted-foreground">Your message</div>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* All Milestones Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            🏆 Community Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  milestone.unlocked 
                    ? 'bg-success/5 dark:bg-success/20 border-success/20 dark:border-success/80' 
                    : totalSignups >= milestone.current * 0.8
                    ? 'bg-warning/5 dark:bg-warning/20/20 border-warning/20 dark:border-warning/80'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    milestone.unlocked 
                      ? 'bg-success text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {milestone.unlocked ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span className="font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{milestone.title}</h3>
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    <p className="text-xs text-secondary font-medium">{milestone.reward}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {Math.min(totalSignups, milestone.target)} / {milestone.target}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {milestone.unlocked ? 'Unlocked!' : `${milestone.target - totalSignups} to go`}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            🌊 Live Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Sarah from TechCorp just joined the founder tier!', time: '2 min ago', icon: Crown },
              { action: 'Mike shared Nexus on LinkedIn', time: '5 min ago', icon: Share2 },
              { action: '3 new members joined in the last 10 minutes', time: '10 min ago', icon: Users },
              { action: 'Emma referred 2 colleagues to the waitlist', time: '15 min ago', icon: Gift },
              { action: 'Alex from StartupLab upgraded to VIP tier', time: '18 min ago', icon: Star }
            ].map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg"
              >
                <activity.icon className="w-5 h-5 text-secondary" />
                <div className="flex-1">
                  <span className="text-sm">{activity.action}</span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {activity.time}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HypeBuilder; 