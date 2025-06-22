/**
 * Professional Email Upsell Component
 * Shows Microsoft 365 upsell opportunities based on domain analysis
 * Pillar: 1,2 - Business health improvement and revenue generation
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { 
  Mail, 
  Shield, 
  CheckCircle, 
  ExternalLink, 
  TrendingUp,
  Crown,
  Star
} from 'lucide-react';
import { domainAnalysisService } from '@/lib/services/domainAnalysisService';
import { useAuth } from '@/contexts/AuthContext';

interface ProfessionalEmailUpsellProps {
  userId?: string;
  compact?: boolean;
  onDismiss?: () => void;
}

export const ProfessionalEmailUpsell: React.FC<ProfessionalEmailUpsellProps> = ({
  userId,
  compact = false,
  onDismiss
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const effectiveUserId = userId || user?.id;

  useEffect(() => {
    const fetchUpsellRecommendation = async () => {
      if (!effectiveUserId) return;

      try {
        setLoading(true);
        const result = await domainAnalysisService.getMicrosoft365UpsellRecommendation(effectiveUserId);
        
        if (result.shouldShowUpsell && result.recommendation) {
          setRecommendation(result.recommendation);
        }
      } catch (error) {
        console.error('Error fetching upsell recommendation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpsellRecommendation();
  }, [effectiveUserId]);

  const handleGetStarted = () => {
    // Track the upsell click
    showToast({
      title: 'Redirecting to Microsoft 365',
      description: 'We\'ll help you set up professional email for your business.',
      type: 'success'
    });

    // In a real implementation, this would redirect to Microsoft 365 signup
    // or open a setup flow within the app
    window.open('https://www.microsoft.com/en-us/microsoft-365/business', '_blank');
  };

  const handleUpdateKPI = async () => {
    if (!effectiveUserId) return;

    try {
      await domainAnalysisService.updateProfessionalEmailKPI(effectiveUserId, user?.company_id || '');
      showToast({
        title: 'Business Health Updated',
        description: 'Your professional email status has been updated.',
        type: 'success'
      });
      onDismiss?.();
    } catch (error) {
      showToast({
        title: 'Update Failed',
        description: 'Failed to update your business health metrics.',
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return null; // Don't show anything if no upsell needed
  }

  const urgencyColors = {
    low: 'bg-primary/5 border-border',
    medium: 'bg-warning/5 border-border',
    high: 'bg-destructive/5 border-border'
  };

  const urgencyBadgeColors = {
    low: 'bg-primary/10 text-primary',
    medium: 'bg-warning/10 text-warning',
    high: 'bg-destructive/10 text-destructive'
  };

  if (compact) {
    return (
      <Card className={`${urgencyColors[recommendation.urgency]} border-l-4`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{recommendation.title}</h4>
                <p className="text-xs text-muted-foreground">
                  Boost credibility with professional email
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={urgencyBadgeColors[recommendation.urgency]}>
                {recommendation.urgency} priority
              </Badge>
              <Button size="sm" onClick={handleGetStarted}>
                Setup
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${urgencyColors[recommendation.urgency]} border-l-4`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-blue-600" />
            <span>{recommendation.title}</span>
            <Badge className={urgencyBadgeColors[recommendation.urgency]}>
              {recommendation.urgency} priority
            </Badge>
          </CardTitle>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              ×
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">{recommendation.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Benefits */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recommendation.benefits.map((benefit: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Pricing</h4>
              <p className="text-lg font-bold text-blue-600">{recommendation.pricing}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Business Health Impact</p>
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="font-semibold text-green-600">+7 points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        {showDetails && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center">
              <Shield className="h-4 w-4 mr-1 text-blue-500" />
              Security & Compliance Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Advanced Threat Protection</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Data Loss Prevention</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Multi-factor Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Compliance Center</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleGetStarted}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {recommendation.ctaText}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleUpdateKPI}
            className="flex-1"
          >
            Already Have It
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground bg-white/30 rounded p-2">
          <p>
            💡 <strong>Tip:</strong> Professional email addresses increase customer trust by 
            up to 42% and improve email deliverability rates significantly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 