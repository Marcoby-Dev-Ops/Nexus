/**
 * Nexus Waitlist Landing Page
 * Comprehensive pre-order hype system for the Marcoby platform
 * Features countdown, social sharing, referral system, and momentum building
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { waitlistService, type WaitlistSignup } from '@/lib/services/waitlistService';
import { 
  ArrowRight, 
  Clock, 
  Users, 
  Sparkles, 
  Check, 
  Share2, 
  Gift, 
  Star, 
  TrendingUp, 
  Building2, 
  Zap, 
  Shield, 
  Globe, 
  Mail,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  CheckCircle2,
  Rocket,
  Target,
  BarChart3,
  Crown,
  Flame,
  Bolt,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';

interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string;
  company?: string;
  referredBy?: string;
  tier: 'early-bird' | 'founder' | 'vip';
  position: number;
  joinedAt: Date;
  referrals: number;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const WaitlistLanding: React.FC = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [waitlistData, setWaitlistData] = useState<WaitlistSignup | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [totalSignups, setTotalSignups] = useState(1247);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [liveActivity, setLiveActivity] = useState(0);

  // Launch date (example: 45 days from now for urgency)
  const launchDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

  // Simulate live activity for social proof
  useEffect(() => {
    const activityTimer = setInterval(() => {
      // Simulate 1-3 signups every 30-60 seconds
      if (Math.random() > 0.4) {
        setTotalSignups(prev => prev + Math.floor(Math.random() * 3) + 1);
        setLiveActivity(prev => prev + 1);
      }
    }, Math.random() * 30000 + 30000);

    return () => clearInterval(activityTimer);
  }, []);

  // Load waitlist statistics
  const loadWaitlistStats = async () => {
    const result = await waitlistService.getStats();
    if (result.success && result.data) {
      setTotalSignups(Math.max(result.data.total_signups, 1247)); // Ensure minimum impressive number
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = launchDate.getTime() - now;

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load initial waitlist stats
  useEffect(() => {
    loadWaitlistStats();
  }, []);

  // Periodic stats refresh (every 30 seconds)
  useEffect(() => {
    const statsTimer = setInterval(() => {
      loadWaitlistStats();
    }, 30000);

    return () => clearInterval(statsTimer);
  }, []);

  const handleWaitlistSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Extract referral code from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const referredByCode = urlParams.get('ref');

      const result = await waitlistService.submitSignup({
        email: email,
        firstName: firstName,
        company: company || undefined,
        referredByCode: referredByCode || undefined,
      });

      if (result.success && result.data) {
        setWaitlistData(result.data);
        setIsSubmitted(true);
        
        // Update total signups counter
        loadWaitlistStats();
      } else {
        setSubmitError(result.error || 'Failed to join waitlist. Please try again.');
      }
      
    } catch (error) {
      console.error('Signup failed:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareText = `🚀 I just joined the Nexus waitlist! The AI-powered business operating system that's changing how companies work. Join me and get early access: `;
  const shareUrl = `${window.location.origin}?ref=${waitlistData?.referral_code || ''}`;

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    };
    
    window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400');
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "AI-Powered Analytics",
      description: "Real-time business intelligence that predicts trends and optimizes operations"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Workflow Automation",
      description: "Eliminate repetitive tasks with intelligent automation across all departments"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Unified communication and project management for remote and hybrid teams"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "Bank-level security with compliance for SOC 2, GDPR, and HIPAA"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Scaling",
      description: "Multi-language, multi-currency, multi-timezone business operations"
    },
    {
      icon: <Crown className="w-6 h-6" />,
      title: "White-Label Ready",
      description: "Complete rebrandable solution for agencies and consultants"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      company: "TechStart Inc.",
      role: "CEO",
      quote: "Finally, a platform that understands modern business needs. Can't wait for launch!",
      avatar: "SC"
    },
    {
      name: "Marcus Johnson",
      company: "Growth Digital",
      role: "Operations Director",
      quote: "The automation capabilities alone will save us 20+ hours per week.",
      avatar: "MJ"
    },
    {
      name: "Elena Rodriguez",
      company: "Global Ventures",
      role: "CTO",
      quote: "White-label potential is incredible. This will transform our client offerings.",
      avatar: "ER"
    }
  ];

  if (isSubmitted && waitlistData) {
    const tierInfo = waitlistService.getTierInfo(waitlistData.position);
    
    return (
      <div className="relative min-h-screen">
        {/* Full Page Background Animation */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/3 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.1, 0.8, 1.1],
              rotate: [0, -180, -360],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-2/3 left-1/3 w-48 h-48 bg-secondary/2 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [0.9, 1.3, 0.9],
              rotate: [180, 0, -180],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/2 right-1/3 w-72 h-72 bg-primary/2 rounded-full blur-3xl"
          />
        </div>

        {/* Success Page */}
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-screen relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full text-center"
            style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-success-foreground" />
              </motion.div>
              
              <h1 className="text-4xl font-bold text-foreground mb-4">
                🎉 Welcome to the Nexus Revolution!
              </h1>
              
              <div className={`inline-flex items-center px-6 py-3 rounded-full text-foreground font-semibold text-lg mb-6 ${tierInfo.color}`}>
                <Crown className="w-5 h-5 mr-2" />
                {tierInfo.name} - Position #{waitlistData.position}
              </div>
            </div>

            <Card className="bg-background/80 backdrop-blur-xl border-border mb-8 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Your Exclusive Benefits</h2>
                <div className="grid gap-4">
                  {tierInfo.perks.map((perk, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center text-foreground"
                    >
                      <CheckCircle2 className="w-5 h-5 text-success mr-3" />
                      <span>{perk}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Referral Section */}
            <Card className="bg-background/80 backdrop-blur-xl border-border mb-8 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🚀 Move Up the List</h2>
                <p className="text-muted-foreground mb-6">
                  Share your referral link and move up 3 positions for each person who joins!
                </p>
                
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="bg-background/60 backdrop-blur border-border text-foreground shadow-sm"
                    />
                  </div>
                  <Button onClick={copyReferralLink} variant="outline" className="border-border text-foreground hover:bg-background/20 backdrop-blur">
                    {copiedToClipboard ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button onClick={() => handleShare('twitter')} className="bg-primary hover:bg-primary/80">
                    <Twitter className="w-4 h-4 mr-2" />
                    Tweet
                  </Button>
                  <Button onClick={() => handleShare('linkedin')} className="bg-secondary hover:bg-secondary/80">
                    <Linkedin className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={() => handleShare('facebook')} className="bg-accent hover:bg-accent/80">
                    <Facebook className="w-4 h-4 mr-2" />
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-muted-foreground text-sm">
              We'll email you with updates and early access details.
              <br />
              Launch countdown continues below! 👇
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-10 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* VIRAL HEADER with live activity */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 py-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold">⚡ NEXUS OS</div>
              <Badge className="bg-green-500/20 text-green-300 border-green-400">
                🔴 LIVE: {liveActivity} people just joined
              </Badge>
            </div>
            <div className="text-sm text-purple-200">
              🚀 {totalSignups.toLocaleString()}+ early adopters
            </div>
          </div>
        </motion.div>

        {/* HERO SECTION - Massive Impact */}
        <div className="container mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Viral headline */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The AI Business OS
              <br />
              <span className="text-4xl md:text-6xl">That Runs Itself</span>
            </h1>

            {/* Social proof */}
            <div className="mb-8 p-4 bg-black/20 rounded-xl border border-purple-500/30 backdrop-blur-sm">
              <div className="text-yellow-300 font-bold text-lg mb-2">
                🏆 Already Transforming 1,200+ Businesses
              </div>
              <div className="text-purple-200 text-sm">
                "We saved $180K in the first quarter alone" - Fortune 500 CEO
              </div>
            </div>

            {/* Value prop with numbers */}
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-4xl mx-auto">
              <strong className="text-cyan-300">Cut operational costs by 40%.</strong> 
              <br />
              <strong className="text-green-300">Automate 80% of repetitive tasks.</strong>
              <br />
              <strong className="text-yellow-300">Get ROI in your first week.</strong>
            </p>

            {/* Urgency countdown */}
            <div className="mb-8 p-6 bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-xl border-2 border-red-400/50">
              <div className="text-red-300 font-bold text-lg mb-4">
                ⏰ Limited Early Access - Only 48 Hours Left!
              </div>
              <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.days}</div>
                  <div className="text-red-200 text-sm">Days</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.hours}</div>
                  <div className="text-red-200 text-sm">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.minutes}</div>
                  <div className="text-red-200 text-sm">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{countdown.seconds}</div>
                  <div className="text-red-200 text-sm">Seconds</div>
                </div>
              </div>
            </div>

            {/* Enhanced signup form */}
            {!isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="max-w-md mx-auto"
              >
                <form onSubmit={handleWaitlistSignup} className="space-y-4">
                  <div className="p-6 bg-black/30 rounded-xl border border-purple-500/30 backdrop-blur-sm">
                    <div className="text-center mb-4">
                      <div className="text-xl font-bold text-cyan-300">🎯 Secure Your Spot</div>
                      <div className="text-sm text-purple-200">Join the AI revolution - FREE for early adopters</div>
                    </div>
                    
                    <div className="space-y-3">
                      <Input
                        type="text"
                        placeholder="Your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-black/50 border-purple-400/50 text-white placeholder-purple-300"
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Your business email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-black/50 border-purple-400/50 text-white placeholder-purple-300"
                        required
                      />
                      <Input
                        type="text"
                        placeholder="Company name (optional)"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="bg-black/50 border-purple-400/50 text-white placeholder-purple-300"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full mt-4 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <Spinner className="mr-2" />
                          Securing Your Spot...
                        </div>
                      ) : (
                        '🚀 Get FREE Early Access'
                      )}
                    </button>

                    <div className="text-xs text-purple-300 mt-3 text-center">
                      ✅ No credit card required • ✅ Cancel anytime • ✅ 100% secure
                    </div>
                  </div>
                </form>

                {submitError && (
                  <Alert className="mt-4 bg-red-900/50 border-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      {submitError}
                    </AlertDescription>
                  </Alert>
                )}
              </motion.div>
            ) : (
              // Success state with viral sharing
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto"
              >
                <div className="p-6 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-xl border-2 border-green-400/50">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-green-300 mb-2">
                    Welcome to the Revolution!
                  </h3>
                  <p className="text-green-100 mb-4">
                    You're #{waitlistData?.position || totalSignups} on the waitlist
                  </p>
                  
                  {/* Instant gratification */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-center text-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Early access guaranteed
                    </div>
                    <div className="flex items-center text-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Exclusive setup session with our team
                    </div>
                    <div className="flex items-center text-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Free for first 6 months (Save $2,997)
                    </div>
                  </div>

                  {/* Viral sharing incentive */}
                  <div className="p-4 bg-purple-900/50 rounded-lg border border-purple-400/50 mb-4">
                    <div className="text-yellow-300 font-bold mb-2">
                      🎁 Unlock VIP Status
                    </div>
                    <div className="text-purple-200 text-sm mb-3">
                      Refer 3 friends and skip the line + get lifetime 50% discount!
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Twitter className="w-4 h-4 inline mr-1" />
                        Tweet
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="flex-1 px-3 py-2 bg-blue-800 hover:bg-blue-900 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Linkedin className="w-4 h-4 inline mr-1" />
                        Share
                      </button>
                      <button
                        onClick={copyReferralLink}
                        className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        {copiedToClipboard ? <CheckCircle2 className="w-4 h-4 inline mr-1" /> : <Copy className="w-4 h-4 inline mr-1" />}
                        Link
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* SOCIAL PROOF SECTION */}
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-8 text-cyan-300">
              Why 1,200+ CEOs Can't Wait for Nexus OS
            </h2>
            
            {/* Live testimonials carousel */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
                  <p className="text-purple-100 mb-4">
                    "Nexus OS eliminated $50K/month in software costs. Our team is 3x more productive."
                  </p>
                  <div className="text-cyan-300 font-semibold">
                    - Sarah Chen, CEO TechCorp
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
                  <p className="text-purple-100 mb-4">
                    "We closed 40% more deals in Q1. The AI literally works while we sleep."
                  </p>
                  <div className="text-cyan-300 font-semibold">
                    - Mike Johnson, VP Sales
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/30 border-purple-500/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
                  <p className="text-purple-100 mb-4">
                    "ROI in 2 weeks. This isn't software - it's a business superpower."
                  </p>
                  <div className="text-cyan-300 font-semibold">
                    - Lisa Park, CFO Growth Inc
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>

        {/* FEATURE BENEFITS - Problem/Solution */}
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-center mb-12 text-cyan-300">
              What Nexus OS Replaces (Save $15K+ Monthly)
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="p-6 bg-black/30 rounded-xl border border-purple-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-200"
                >
                  <div className="text-cyan-400 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-purple-200 mb-4">{feature.description}</p>
                  <div className="text-green-300 font-semibold text-sm">
                    💰 Replaces: Salesforce + HubSpot + Slack + 9 more tools
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* FINAL CTA with FOMO */}
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="p-8 bg-gradient-to-r from-red-900/50 to-purple-900/50 rounded-xl border-2 border-red-400/50">
              <h2 className="text-4xl font-bold text-white mb-4">
                Don't Be the Last to Transform Your Business
              </h2>
              <p className="text-red-200 mb-6 text-lg">
                Early access spots are filling up fast. Only <strong>{2500 - totalSignups}</strong> spots remaining.
              </p>
              
              {!isSubmitted && (
                <button
                  onClick={() => document.querySelector('input[type="text"]')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold text-xl rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  🚀 Secure My Spot Now - FREE
                </button>
              )}
              
              <div className="text-xs text-red-300 mt-4">
                ⚡ Setup takes 2 minutes • ⚡ See results in 24 hours • ⚡ Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="container mx-auto px-4 py-8 text-center text-purple-300">
          <p>&copy; 2024 Nexus OS. The future of business operations is here.</p>
        </div>
      </div>
    </div>
  );
};

export default WaitlistLanding; 