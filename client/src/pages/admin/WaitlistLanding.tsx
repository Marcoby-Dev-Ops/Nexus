/**
 * Nexus Waitlist Landing Page
 * Comprehensive pre-order hype system for the Marcoby platform
 * Features countdown, social sharing, referral system, and momentum building
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { waitlistService, type WaitlistSignup } from '@/components/admin/onboarding/lib/waitlistService';
import { ArrowRight, Users, Sparkles, Check, Zap, Shield, Globe, Twitter, Linkedin, Facebook, Copy, CheckCircle2, BarChart3, Crown, Bolt, AlertCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardContent } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Spinner } from '@/shared/components/ui/Spinner';
import Confetti from '@/shared/components/Confetti';

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

  // Launch date (example: 45 days from now for urgency)
  const launchDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

  // Simulate live activity for social proof
  useEffect(() => {
    const activityTimer = setInterval(() => {
      // Simulate 1-3 signups every 30-60 seconds
      if (Math.random() > 0.4) {
        setTotalSignups(prev => prev + Math.floor(Math.random() * 3) + 1);
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
       
     
    // eslint-disable-next-line no-console
    console.error('Signup failed: ', error);
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

  return (
    <div className="bg-background text-foreground">
      <div className="relative overflow-hidden">
        {isSubmitted && <Confetti />}

        {/* Animated Gradient Background */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,hsl(var(--primary)/0.15),rgba(255,255,255,0))]" />

        <div className="container mx-auto px-4 sm: px-6 lg:px-8">
          {/* ----- Header ----- */}
          <header className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Bolt className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold tracking-tighter">Nexus</span>
            </div>
            <Button variant="ghost" onClick={() => window.location.href = '/login'}>
              Log In <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </header>

          <main>
            {/* ----- Hero Section ----- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center pt-20 pb-24 md:pt-28 md:pb-32"
            >
              <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Launching Q4 2024
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-6">
                The AI-Powered OS for Modern Business
              </h1>
              <p className="max-w-3xl lg:max-w-4xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
                Nexus centralizes your sales, finance, and operations with an AI layer that automates workflows and delivers predictive insights to fuel your growth.
              </p>

              {!isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <form onSubmit={handleWaitlistSignup} className="max-w-xl lg:max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <Input
                        type="email"
                        placeholder="Your Business Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                        required
                      />
                      <Button type="submit" size="lg" className="w-full sm: w-auto" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner /> : 'Get Early Access'}
                      </Button>
                    </div>
                    {submitError && (
                      <Alert variant="error" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{submitError}</AlertDescription>
                      </Alert>
                    )}
                  </form>
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <div className="flex -space-x-2">
                      <img className="inline-block h-8 w-8 rounded-full ring-2 ring-background" src="https: //i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" />
                      <img className="inline-block h-8 w-8 rounded-full ring-2 ring-background" src="https://i.pravatar.cc/150?u=a042581f4e29026704e" alt="User" />
                      <img className="inline-block h-8 w-8 rounded-full ring-2 ring-background" src="https://i.pravatar.cc/150?u=a042581f4e29026704f" alt="User" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      <span className="font-bold text-foreground">{totalSignups.toLocaleString()}+</span> businesses on the waitlist
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto"
                >
                  <Card className="text-center p-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-8 h-8 text-success-foreground" />
                    </motion.div>
                    <h2 className="text-3xl font-bold mb-4">You're on the list!</h2>
                    <p className="text-muted-foreground mb-6">
                      You are position <span className="text-primary font-bold">#{waitlistData?.position}</span>. We'll email you with updates and early access details.
                    </p>
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <h3 className="text-lg font-semibold text-primary mb-2">🎁 Want to move up the list?</h3>
                      <p className="text-sm text-primary/80 mb-4">Share your unique link. For every friend who joins, you'll jump ahead!</p>
                      <div className="flex gap-2">
                        <Input value={shareUrl} readOnly className="bg-background/50" />
                        <Button onClick={copyReferralLink} variant="outline">
                          {copiedToClipboard ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <div className="mt-4 flex justify-center gap-2">
                        <Button onClick={() => handleShare('twitter')} variant="outline" size="icon"><Twitter className="w-4 h-4" /></Button>
                        <Button onClick={() => handleShare('linkedin')} variant="outline" size="icon"><Linkedin className="w-4 h-4" /></Button>
                        <Button onClick={() => handleShare('facebook')} variant="outline" size="icon"><Facebook className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </main>
        </div>
      </div>

      {/* ----- Features Section ----- */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4 sm: px-6 lg:px-8">
          <div className="text-center max-w-3xl lg:max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">One Platform to Rule Them All</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Stop gluing together a dozen different tools. Nexus provides a single source of truth, saving you time, money, and sanity.
            </p>
          </div>
          <div className="mt-20 grid gap-12 sm: grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  {feature.icon}
                </div>
                <div className="mt-5">
                  <h3 className="text-lg font-semibold leading-6">{feature.title}</h3>
                  <p className="mt-2 text-base text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ----- Testimonials Section ----- */}
      <div className="py-24 bg-primary/5">
        <div className="container mx-auto px-4 sm: px-6 lg:px-8">
          <div className="text-center max-w-3xl lg:max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Loved by Leaders at Visionary Companies</h2>
          </div>
          <div className="mt-20 grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex-grow">
                      <p className="text-muted-foreground">"{testimonial.quote}"</p>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ----- Countdown Section ----- */}
      <div className="bg-background">
        <div className="container mx-auto px-4 sm: px-6 lg:px-8 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">The Future is Arriving Soon</h2>
            <p className="text-lg text-muted-foreground mb-12">
              Be the first to experience the power of a truly unified business OS. Early access spots are limited.
            </p>
            <Card className="inline-block p-6 bg-primary/10 border-primary/20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary">{countdown.days}</div>
                  <div className="text-sm text-muted-foreground">Days</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">{countdown.hours}</div>
                  <div className="text-sm text-muted-foreground">Hours</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">{countdown.minutes}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary">{countdown.seconds}</div>
                  <div className="text-sm text-muted-foreground">Seconds</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ----- Footer ----- */}
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} Nexus OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default WaitlistLanding; 
