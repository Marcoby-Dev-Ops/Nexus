import React, { useState, useEffect } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useSignupOptimization } from '@/hooks/useSignupOptimization';
import { OptimizedSignupField } from '@/components/auth/OptimizedSignupField';
import { SignupProgressIndicator } from '@/components/auth/SignupProgressIndicator';
import { ExitIntentModal } from '@/components/auth/ExitIntentModal';
import { SocialProofBanner } from '@/components/auth/SocialProofBanner';
import { SignupAnalytics } from '@/components/auth/SignupAnalytics';
import { AuthentikSignupService } from '@/services/auth/AuthentikSignupService';
import { UsernameSelector } from '@/components/auth/UsernameSelector';
import { buildApiUrl } from '@/lib/api-url';

type SignupStep = 'business-info' | 'contact-info' | 'username-selection' | 'verification';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showSocialProof, setShowSocialProof] = useState(true);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [userCredentials, setUserCredentials] = useState<{ username: string; password: string } | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<{ email?: string; username?: string } | null>(null);
  
  const navigate = useNavigate();
  const { signIn } = useAuthentikAuth();
  
  const {
    formData,
    currentStep,
    errors,
    isValid,
    isDirty,
    autoSaveStatus,
    progress,
    conditionalFields,
    dynamicOptions,
    usernameSuggestions,
    selectedUsername,
    isCheckingUsername,
    usernameError,
    updateField,
    goToStep,
    getFieldError,
    isStepComplete,
    clearSavedData,
    handleUsernameSelect,
  } = useSignupOptimization();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for enrollment data and authenticated user
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const username = urlParams.get('username');
    
    // Check if user is coming from enrollment flow (has authenticated session)
    const checkEnrollmentUser = async () => {
      try {
        // Check if user has an authenticated session (coming from enrollment flow)
        const sessionResponse = await fetch(buildApiUrl('/api/auth/session-info'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.data?.userId) {
            // User is authenticated, get their details
            const userResponse = await fetch(buildApiUrl(`/api/auth/user-details/${sessionData.data.userId}`), {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.user) {
                const user = userData.user;
                setEnrollmentData({ 
                  email: user.email, 
                  username: user.username 
                });
                
                // Pre-populate form with user data
                updateField('email', user.email);
                if (user.username) {
                  handleUsernameSelect(user.username);
                }
                if (user.attributes?.first_name) {
                  updateField('firstName', user.attributes.first_name);
                }
                if (user.attributes?.last_name) {
                  updateField('lastName', user.attributes.last_name);
                }
                
                // Skip to business info step since user is already verified
                goToStep('business-info');
                return;
              }
            }
          }
        }
      } catch (error) {
        console.log('No authenticated session found, proceeding with normal signup flow');
      }
    };

    // If URL parameters are provided, use them (fallback)
    if (email || username) {
      setEnrollmentData({ email: email || undefined, username: username || undefined });
      
      // Pre-populate form data if available
      if (email) {
        updateField('email', email);
      }
      if (username) {
        handleUsernameSelect(username);
      }
      
      // If we have both email and username, skip to business info step
      if (email && username) {
        goToStep('business-info');
      }
    } else {
      // No URL parameters, check for authenticated session
      checkEnrollmentUser();
    }
  }, []);

  // Exit intent detection
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && isDirty && currentStep !== 'verification') {
        setShowExitIntent(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && currentStep !== 'verification') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, currentStep]);

  // Analytics tracking
  const handleStepComplete = (step: string) => {
    // In a real app, this would send data to your analytics service
    console.log(`Step completed: ${step}`);
  };

  const handleNextStep = () => {
    if (currentStep === 'business-info' && isStepComplete('business-info')) {
      goToStep('contact-info');
    } else if (currentStep === 'contact-info' && isStepComplete('contact-info')) {
      goToStep('username-selection');
    } else if (currentStep === 'username-selection' && isStepComplete('username-selection')) {
      goToStep('verification');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'contact-info') {
      goToStep('business-info');
    } else if (currentStep === 'username-selection') {
      goToStep('contact-info');
    } else if (currentStep === 'verification') {
      goToStep('username-selection');
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      // If user is coming from enrollment flow, update existing user instead of creating new one
      if (enrollmentData?.email && enrollmentData?.username) {
        // Update existing user with business information
        const result = await AuthentikSignupService.updateUserFromSignup({
          businessName: formData.businessName,
          businessType: formData.businessType,
          industry: formData.industry,
          companySize: formData.companySize,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          fundingStage: formData.fundingStage || undefined,
          revenueRange: formData.revenueRange || undefined,
          username: enrollmentData.username,
        });

        if (!result.success) {
          setError(result.error || 'Failed to update account');
          setLoading(false);
          return;
        }

        // Clear saved data on successful signup
        clearSavedData();
        setSignupSuccess(true);

        // Redirect to dashboard since user is already verified
        navigate('/dashboard');
        return;
      }

      // Check if user already exists first
      const userExists = await AuthentikSignupService.checkUserExists(formData.email);
      
      let result;
      if (userExists) {
        // User exists, update their business info instead
        result = await AuthentikSignupService.updateBusinessInfo({
          businessName: formData.businessName,
          businessType: formData.businessType,
          industry: formData.industry,
          companySize: formData.companySize,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          fundingStage: formData.fundingStage || undefined,
          revenueRange: formData.revenueRange || undefined,
          username: selectedUsername || undefined,
        });
      } else {
        // For new users, create the user first
        result = await AuthentikSignupService.createUser({
          businessName: formData.businessName,
          businessType: formData.businessType,
          industry: formData.industry,
          companySize: formData.companySize,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          fundingStage: formData.fundingStage || undefined,
          revenueRange: formData.revenueRange || undefined,
          username: selectedUsername || undefined, // Include selected username
        });
      }

      if (!result.success) {
        setError(result.error || 'Failed to process your account');
        setLoading(false);
        return;
      }

      // Clear saved data on successful processing
      clearSavedData();
      setSignupSuccess(true);

      // For new users, redirect to Authentik login flow to complete authentication
      // This will allow them to set their password and complete verification
      if (!userExists) {
        const signInResult = await signIn();
        if (!signInResult.success) {
          // If signIn fails, still show success but with a note about manual login
          console.warn('Auto sign-in failed, user will need to login manually:', signInResult.error);
        }
      } else {
        // For existing users, redirect to dashboard
        navigate('/dashboard');
      }

    } catch (err) {
      setError('An unexpected error occurred while creating your account');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced business type options with descriptions
  const businessTypeOptions = [
    { value: 'startup', label: 'Startup', description: 'Early-stage company seeking growth' },
    { value: 'small-business', label: 'Small Business', description: 'Established business with <50 employees' },
    { value: 'medium-business', label: 'Medium Business', description: 'Growing company with 50-500 employees' },
    { value: 'enterprise', label: 'Enterprise', description: 'Large organization with 500+ employees' },
    { value: 'non-profit', label: 'Non-Profit', description: 'Mission-driven organization' },
  ];

  // Enhanced industry options with auto-suggestions
  const industryOptions = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'education', label: 'Education' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'other', label: 'Other' },
  ];

  // Auto-suggestions for business names
  const businessNameSuggestions = [
    'TechFlow Solutions',
    'InnovateCorp',
    'Growth Dynamics',
    'Future Forward',
    'Peak Performance',
    'Elite Enterprises',
    'Vision Ventures',
    'Success Systems',
  ];

  // Auto-suggestions for industries
  const industrySuggestions = [
    'SaaS / Software',
    'FinTech',
    'HealthTech',
    'EdTech',
    'E-commerce',
    'AI / Machine Learning',
    'Cybersecurity',
    'Digital Marketing',
    'Consulting Services',
    'Manufacturing',
    'Healthcare',
    'Education',
    'Real Estate',
    'Food & Beverage',
  ];

  const renderBusinessInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedSignupField
          type="text"
          name="businessName"
          label="Business Name"
          value={formData.businessName}
          onChange={(value) => updateField('businessName', value)}
          error={getFieldError('businessName')}
          placeholder="Enter your business name"
          required
          autoComplete="organization"
          maxLength={100}
          autoSuggestions={businessNameSuggestions}
          helpText="Use your official business name as it appears on legal documents"
          showHelp={true}
        />
        
        <OptimizedSignupField
          type="select"
          name="businessType"
          label="Business Type"
          value={formData.businessType}
          onChange={(value) => updateField('businessType', value)}
          error={getFieldError('businessType')}
          options={businessTypeOptions}
          required
          helpText="This helps us customize your experience and provide relevant insights"
          showHelp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedSignupField
          type="select"
          name="industry"
          label="Industry"
          value={formData.industry}
          onChange={(value) => updateField('industry', value)}
          error={getFieldError('industry')}
          options={dynamicOptions.industry.length > 0 ? dynamicOptions.industry : industryOptions}
          required
          helpText="Select your primary industry for tailored business insights"
          showHelp={true}
        />

        <OptimizedSignupField
          type="select"
          name="companySize"
          label="Company Size"
          value={formData.companySize}
          onChange={(value) => updateField('companySize', value)}
          error={getFieldError('companySize')}
          options={dynamicOptions.companySize.length > 0 ? dynamicOptions.companySize : [
            { value: '1-10', label: '1-10 employees' },
            { value: '11-50', label: '11-50 employees' },
            { value: '51-200', label: '51-200 employees' },
            { value: '201-1000', label: '201-1000 employees' },
            { value: '1000+', label: '1000+ employees' },
          ]}
          required
          helpText="This helps us provide appropriate scaling recommendations"
          showHelp={true}
        />
      </div>

      {/* Conditional fields based on business type */}
      {conditionalFields.showFundingStage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OptimizedSignupField
            type="select"
            name="fundingStage"
            label="Funding Stage"
            value={formData.fundingStage || ''}
            onChange={(value) => updateField('fundingStage', value)}
            options={[
              { value: 'bootstrap', label: 'Bootstrap (Self-funded)' },
              { value: 'seed', label: 'Seed Stage' },
              { value: 'series-a', label: 'Series A' },
              { value: 'series-b', label: 'Series B' },
              { value: 'series-c', label: 'Series C+' },
              { value: 'public', label: 'Public Company' },
            ]}
            helpText="Understanding your funding stage helps us provide relevant financial insights"
            showHelp={true}
          />

          {conditionalFields.showRevenueRange && (
            <OptimizedSignupField
              type="select"
              name="revenueRange"
              label="Annual Revenue Range"
              value={formData.revenueRange || ''}
              onChange={(value) => updateField('revenueRange', value)}
              options={[
                { value: '0-100k', label: '$0 - $100K' },
                { value: '100k-500k', label: '$100K - $500K' },
                { value: '500k-1m', label: '$500K - $1M' },
                { value: '1m-5m', label: '$1M - $5M' },
                { value: '5m-10m', label: '$5M - $10M' },
                { value: '10m+', label: '$10M+' },
              ]}
              helpText="This helps us provide relevant benchmarking and growth strategies"
              showHelp={true}
            />
          )}
        </div>
      )}

      {conditionalFields.showRevenueRange && !conditionalFields.showFundingStage && (
        <OptimizedSignupField
          type="select"
          name="revenueRange"
          label="Annual Revenue Range"
          value={formData.revenueRange || ''}
          onChange={(value) => updateField('revenueRange', value)}
          options={[
            { value: '0-100k', label: '$0 - $100K' },
            { value: '100k-500k', label: '$100K - $500K' },
            { value: '500k-1m', label: '$500K - $1M' },
            { value: '1m-5m', label: '$1M - $5M' },
            { value: '5m-10m', label: '$5M - $10M' },
            { value: '10m+', label: '$10M+' },
          ]}
          helpText="This helps us provide relevant benchmarking and growth strategies"
          showHelp={true}
        />
      )}

      <button
        onClick={handleNextStep}
        disabled={!isValid}
        className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Next Step
      </button>
    </div>
  );

  const renderContactInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedSignupField
          type="text"
          name="firstName"
          label="First Name"
          value={formData.firstName}
          onChange={(value) => updateField('firstName', value)}
          error={getFieldError('firstName')}
          placeholder="First name"
          required
          autoComplete="given-name"
          maxLength={50}
          helpText="We'll use this to personalize your experience"
          showHelp={true}
        />
        <OptimizedSignupField
          type="text"
          name="lastName"
          label="Last Name"
          value={formData.lastName}
          onChange={(value) => updateField('lastName', value)}
          error={getFieldError('lastName')}
          placeholder="Last name"
          required
          autoComplete="family-name"
          maxLength={50}
          helpText="We'll use this to personalize your experience"
          showHelp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizedSignupField
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          error={getFieldError('email')}
          placeholder="your.email@company.com"
          required
          autoComplete="email"
          inputMode="email"
          helpText="This will be your login email and we'll send important updates here"
          showHelp={true}
        />

        <OptimizedSignupField
          type="tel"
          name="phone"
          label="Phone Number"
          value={formData.phone ?? ''}
          onChange={(value: string) => updateField('phone', value)}
          error={getFieldError('phone')}
          placeholder="+1 (555) 123-4567"
          autoComplete="tel"
          inputMode="tel"
          pattern="^\+?[\d\s-()]+$"
          helpText="Optional - for account recovery and important notifications"
          showHelp={true}
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handlePrevStep}
          className="flex-1 py-4 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/20"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!isValid}
          className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderUsernameSelectionStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h4 className="text-blue-200 font-medium mb-2">
          {enrollmentData?.username ? 'Confirm Your Username' : 'Choose Your Username'}
        </h4>
        <p className="text-sm text-blue-300">
          {enrollmentData?.username 
            ? 'Your username is already set from the enrollment process. You can change it if needed.'
            : 'Select a username for your Nexus account. This will be used for logging in.'
          }
        </p>
      </div>

      <UsernameSelector
        suggestions={usernameSuggestions}
        selectedUsername={selectedUsername}
        isCheckingUsername={isCheckingUsername}
        usernameError={usernameError}
        onUsernameSelect={handleUsernameSelect}
        onCustomUsernameChange={(username) => handleUsernameSelect(username)}
      />

      <div className="flex space-x-4">
        <button
          onClick={handlePrevStep}
          className="flex-1 py-4 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/20"
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          disabled={!selectedUsername || !!usernameError}
          className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      {signupSuccess ? (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h4 className="text-green-200 font-bold text-lg">
                {enrollmentData?.email && enrollmentData?.username 
                  ? 'Account Setup Complete!' 
                  : 'Account Created Successfully!'
                }
              </h4>
            </div>
            <p className="text-green-300 mb-4">
              {enrollmentData?.email && enrollmentData?.username 
                ? 'Welcome to Nexus! Your account has been updated with business information and you\'re being redirected to your dashboard.'
                : 'Welcome to Nexus! Your account has been created successfully. You\'ll now be redirected to complete your authentication setup.'
              }
            </p>
            <div className="bg-green-500/20 rounded-lg p-4">
              <h5 className="text-green-200 font-semibold mb-2">Next Steps:</h5>
              <ul className="text-green-300 text-sm space-y-1">
                {enrollmentData?.email && enrollmentData?.username ? (
                  <>
                    <li>• You'll be redirected to your Nexus dashboard</li>
                    <li>• Your account is fully set up and ready to use</li>
                    <li>• Start exploring Nexus features and capabilities</li>
                    <li>• Configure your business settings and preferences</li>
                  </>
                ) : (
                  <>
                    <li>• You'll be redirected to Marcoby's secure authentication system</li>
                    <li>• Set your password to complete account setup</li>
                    <li>• Verify your email address if prompted</li>
                    <li>• Once authenticated, you'll access your Nexus dashboard</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-blue-200 font-medium mb-1">Secure Authentication</h5>
                <p className="text-blue-300 text-sm">Your account is secured through Marcoby's Identity and Access Management system.</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-yellow-200 font-medium mb-1">Important: Email Verification Required</h5>
                <p className="text-yellow-300 text-sm">You cannot sign in until you verify your email address. Please check your inbox and click the verification link before attempting to sign in.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1 py-4 px-6 bg-green-500/20 border border-green-500/30 text-green-200 font-semibold rounded-xl flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400 mr-3"></div>
              {enrollmentData?.email && enrollmentData?.username 
                ? 'Redirecting to dashboard...'
                : 'Redirecting to authentication setup...'
              }
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <h4 className="text-green-200 font-medium mb-2">Ready to create your account?</h4>
            <ul className="text-sm text-green-300 space-y-1">
              <li>• Your business information will be used to set up your Nexus workspace</li>
              <li>• You'll receive login credentials via email</li>
              <li>• After registration, you'll have immediate access to Nexus</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="text-blue-200 font-medium mb-1">Secure Authentication</h5>
                <p className="text-blue-300 text-sm">Your account will be created through Marcoby's secure Identity and Access Management system.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handlePrevStep}
              className="flex-1 py-4 px-6 bg-white/10 border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 hover:bg-white/20"
            >
              Back
            </button>
            <button
              onClick={handleSignup}
              disabled={loading}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span className="animate-pulse">Creating your account...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'business-info':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Complete your business profile'
          : 'Tell us about your business';
      case 'contact-info':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Update your contact information'
          : 'Your contact information';
      case 'username-selection':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Confirm your username'
          : 'Choose Your Username';
      case 'verification':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Complete your setup'
          : 'Complete registration with Marcoby';
      default:
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Complete your Nexus setup'
          : 'Sign up for Nexus';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'business-info':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Let\'s complete your business profile to personalize your Nexus experience'
          : 'Help us understand your business needs to provide the best experience';
      case 'contact-info':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'We\'ll use this information to keep you updated and provide support'
          : 'We\'ll use this information to set up your account and keep you updated';
      case 'username-selection':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Your username is already set. You can change it if needed.'
          : 'Choose a unique username for your Nexus account.';
      case 'verification':
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Complete your business profile setup and access your Nexus dashboard'
          : 'Complete your registration through Marcoby IAM for secure access';
      default:
        return enrollmentData?.email && enrollmentData?.username 
          ? 'Complete your Nexus setup and start growing your business'
          : 'Join thousands of businesses using Nexus to grow and succeed';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: 'url(/marcoby_authentik_logos/flow_background.jpg)',
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 via-green-900/5 to-slate-900/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className={`w-full max-w-2xl transform transition-all duration-700 ease-out ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="/Nexus/Nexus by Marcoby - Transparent (500x250).png"
                alt="Nexus by Marcoby"
                className="w-64 h-auto drop-shadow-2xl animate-float"
              />
            </div>
            <div className="mt-4 w-16 h-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mx-auto"></div>
          </div>

          {/* Social Proof Banner */}
          {showSocialProof && (
            <div className="mb-6">
              <SocialProofBanner />
            </div>
          )}

          {/* Signup card */}
          <div className="backdrop-blur-2xl bg-black/40 border border-white/40 rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-3">
                {getStepTitle()}
              </h2>
              <p className="text-green-200 text-sm">
                {getStepDescription()}
              </p>
            </div>

            {/* Progress Indicator */}
            <SignupProgressIndicator
              currentStep={currentStep}
              progress={progress}
              autoSaveStatus={autoSaveStatus}
              isDirty={isDirty}
            />

            {error && (
              <div className="backdrop-blur-md bg-red-500/20 border border-red-500/30 rounded-xl p-4 animate-pulse mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {currentStep === 'business-info' && renderBusinessInfoStep()}
              {currentStep === 'contact-info' && renderContactInfoStep()}
              {currentStep === 'username-selection' && renderUsernameSelectionStep()}
              {currentStep === 'verification' && renderVerificationStep()}
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-sm text-green-300">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-green-200 hover:text-white transition-colors duration-200 font-medium underline"
              >
                Sign in here
              </Link>
            </p>
            <p className="text-sm text-green-300">
              <Link 
                to="/" 
                className="text-green-200 hover:text-white transition-colors duration-200 flex items-center justify-center group"
              >
               <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
               </svg>
               Back to home page
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Exit Intent Modal */}
      <ExitIntentModal
        isVisible={showExitIntent}
        onClose={() => setShowExitIntent(false)}
        onContinue={() => setShowExitIntent(false)}
        onSaveProgress={() => {
          // Progress is already auto-saved
          setShowExitIntent(false);
        }}
        formData={formData}
        currentStep={currentStep}
      />

      {/* Analytics Component (hidden by default, shows on hover) */}
      <SignupAnalytics
        currentStep={currentStep}
        formData={formData}
        isDirty={isDirty}
        errors={errors}
        onStepComplete={handleStepComplete}
      />
    </div>
  );
}
