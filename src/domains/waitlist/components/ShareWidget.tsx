/**
 * Share Widget Component
 * Compact, embeddable widget for promoting Nexus waitlist
 * Can be embedded in existing pages, emails, and external sites
 */

import React, { useState } from 'react';
import {
  Share2,
  Twitter,
  Linkedin,
  Facebook,
  Copy,
  CheckCircle2,
  Users,
  Flame,
  Crown,
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Card, CardContent } from '@/shared/components/ui/Card';

interface ShareWidgetProps {
  variant?: 'compact' | 'full' | 'minimal';
  theme?: 'light' | 'dark' | 'gradient';
  showStats?: boolean;
  referralCode?: string;
  className?: string;
}

const ShareWidget: React.FC<ShareWidgetProps> = ({
  variant = 'compact',
  theme = 'gradient',
  showStats = true,
  referralCode = 'NEXUS-SHARE',
  className = ''
}) => {
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [totalSignups] = useState(2847);
  const [recentSignups] = useState(23);

  const shareUrl = `${window.location.origin}/join?ref=${referralCode}`;
  
  const shareText = "🚀 Join me on the Nexus waitlist! The AI-powered business operating system that's transforming how companies work. Early access is limited!";

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(shareUrl);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    };
    
    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return 'bg-card text-foreground border-border';
      case 'dark':
        return 'bg-background text-primary-foreground border-border';
      case 'gradient':
        return 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 text-primary-foreground border-purple-200/20';
      default:
        return 'bg-card text-foreground border-border';
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <Button
          onClick={() => window.open('/waitlist', '_blank')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-primary-foreground text-sm"
          size="sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Join Nexus Waitlist
        </Button>
        <Badge className="bg-success/10 text-success text-xs">
          {totalSignups.toLocaleString()} members
        </Badge>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`${getThemeClasses()} ${className} max-w-sm`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-sm mb-1">Join the Nexus Revolution</h3>
              <p className="text-xs opacity-80 mb-3">
                AI-powered business OS. Limited early access.
              </p>
              
              {showStats && (
                <div className="flex items-center space-x-4 text-xs opacity-70 mb-3">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {totalSignups.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <Flame className="w-3 h-3 mr-1" />
                    +{recentSignups} today
                  </span>
                </div>
              )}
              
              <div className="flex space-x-1">
                <Button
                  onClick={() => window.open('/waitlist', '_blank')}
                  size="sm"
                  className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-primary-foreground"
                >
                  Join Now
                </Button>
                <Button
                  onClick={() => handleShare('twitter')}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${getThemeClasses()} ${className} max-w-md`}>
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <img
              src="/Nexus/nexus-square-40x40-transparent.svg"
              alt="Nexus"
              className="w-8 h-8 filter brightness-0 invert"
            />
          </div>
          
          <h2 className="text-xl font-bold mb-2">🚀 Join the Nexus Revolution</h2>
          <p className="text-sm opacity-80 mb-4">
            Be among the first to experience the AI-powered business operating system 
            that's transforming how modern companies work and scale.
          </p>
          
          {showStats && (
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{totalSignups.toLocaleString()}</div>
                <div className="text-xs opacity-70">Early Adopters</div>
              </div>
              <div className="w-px h-10 bg-current opacity-20" />
              <div className="text-center">
                <div className="text-2xl font-bold text-success">+{recentSignups}</div>
                <div className="text-xs opacity-70">Joined Today</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => window.open('/waitlist', '_blank')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-primary-foreground"
          >
            <Crown className="w-4 h-4 mr-2" />
            Secure Your Spot Now
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <div className="grid grid-cols-4 gap-2">
            <Button
              onClick={() => handleShare('twitter')}
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
            >
              <Twitter className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleShare('linkedin')}
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
            >
              <Linkedin className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => handleShare('facebook')}
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
            >
              <Facebook className="w-4 h-4" />
            </Button>
            <Button
              onClick={copyShareLink}
              variant="outline"
              size="sm"
              className="flex items-center justify-center"
            >
              {copiedToClipboard ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs opacity-60">
              🔥 Founder tier closes at 100 members • White-label opportunities available
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareWidget; 