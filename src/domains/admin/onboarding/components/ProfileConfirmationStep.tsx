/**
 * ProfileConfirmationStep.tsx
 * First step in onboarding - confirm/update user profile information
 * Allows users to set their first name, last name, and display name
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Label } from '@/shared/components/ui/Label';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';

interface ProfileConfirmationStepProps {
  step: any;
  state: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  user: any;
}

export const ProfileConfirmationStep: React.FC<ProfileConfirmationStepProps> = ({ 
  step: step, 
  state: state, 
  onComplete, 
  onBack: onBack, 
  user: user 
}) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    displayname: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Initialize form with existing user data
  useEffect(() => {
    if (user?.profile) {
      setFormData({
        firstname: user.profile.first_name || '',
        lastname: user.profile.last_name || '',
        displayname: user.profile.display_name || ''
      });
    }
  }, [user?.profile]);

  // Validate form
  useEffect(() => {
    const valid = formData.first_name.trim().length > 0 && formData.last_name.trim().length > 0;
    setIsValid(valid);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      // Update the user profile
      await updateProfile({
        firstname: formData.first_name.trim(),
        lastname: formData.last_name.trim(),
        displayname: formData.display_name.trim() || `${formData.first_name.trim()} ${formData.last_name.trim()}`
      });

      // Complete the step
      onComplete({
        userProfile: {
          user: {
            firstName: formData.first_name.trim(),
            lastName: formData.last_name.trim(),
            displayName: formData.display_name.trim() || `${formData.first_name.trim()} ${formData.last_name.trim()}`
          }
        }
      });
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Profile update error: ', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserGreeting = () => {
    if (user?.profile?.first_name) return user.profile.first_name;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-primary/10 rounded-full">
            <User className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold">Loading...</h2>
          <p className="text-lg text-muted-foreground">
            Please wait while we load your profile information.
          </p>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-destructive/10 rounded-full">
            <User className="w-12 h-12 text-destructive" />
          </div>
          <h2 className="text-3xl font-bold">Authentication Required</h2>
          <p className="text-lg text-muted-foreground">
            Please log in to continue with the onboarding process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="inline-block p-4 bg-primary/10 rounded-full"
        >
          <User className="w-12 h-12 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold">Welcome, {getUserGreeting()}! 👋</h2>
        <p className="text-lg text-muted-foreground">
          Let's make sure we have your information correct before we get started.
        </p>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span>Confirm Your Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Enter your first name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Enter your last name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name (Optional)</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="How you'd like to be known (e.g., 'Von J')"
              value={formData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use your first and last name
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSubmit}
              disabled={!isValid || isLoading}
              className="min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">
                Why we need this information
              </p>
              <p className="text-xs text-muted-foreground">
                Your name helps us personalize your experience throughout Nexus. 
                We'll use it for greetings, recommendations, and making your 
                business brain feel more like a trusted partner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 