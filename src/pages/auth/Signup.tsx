import React, { useState, useEffect } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { useNavigate, Link } from 'react-router-dom';

type SignupStep = 'business-info' | 'contact-info' | 'verification';

export default function Signup() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('business-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companySize: ''
  });

  const { signIn } = useAuthentikAuth();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 'business-info') {
      setCurrentStep('contact-info');
    } else if (currentStep === 'contact-info') {
      setCurrentStep('verification');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'contact-info') {
      setCurrentStep('business-info');
    } else if (currentStep === 'verification') {
      setCurrentStep('contact-info');
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signIn();
      
      if (!result.success) {
        setError(result.error || 'Failed to initiate account creation with Marcoby');
      }
    } catch (err) {
      setError('An unexpected error occurred while connecting to Marcoby');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-3">
        {['business-info', 'contact-info', 'verification'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              currentStep === step 
                ? 'bg-green-600 text-white' 
                : index < ['business-info', 'contact-info', 'verification'].indexOf(currentStep)
                ? 'bg-green-400 text-white'
                : 'bg-gray-600 text-gray-300'
            }`}>
              {index + 1}
            </div>
            {index < 2 && (
              <div className={`w-8 h-0.5 mx-2 ${
                index < ['business-info', 'contact-info', 'verification'].indexOf(currentStep)
                  ? 'bg-green-400'
                  : 'bg-gray-600'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

     const renderBusinessInfoStep = () => (
     <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-green-200 mb-2">
          Business Name *
        </label>
                 <input
           type="text"
           value={formData.businessName}
           onChange={(e) => handleInputChange('businessName', e.target.value)}
           className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
           placeholder="Enter your business name"
         />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-green-200 mb-2">
          Business Type *
        </label>
                          <select
           value={formData.businessType}
           onChange={(e) => handleInputChange('businessType', e.target.value)}
           className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
         >
           <option value="" className="bg-gray-800 text-white">Select business type</option>
           <option value="startup" className="bg-gray-800 text-white">Startup</option>
           <option value="small-business" className="bg-gray-800 text-white">Small Business</option>
           <option value="medium-business" className="bg-gray-800 text-white">Medium Business</option>
           <option value="enterprise" className="bg-gray-800 text-white">Enterprise</option>
           <option value="non-profit" className="bg-gray-800 text-white">Non-Profit</option>
         </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-green-200 mb-2">
          Industry *
        </label>
                          <select
           value={formData.industry}
           onChange={(e) => handleInputChange('industry', e.target.value)}
           className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
         >
           <option value="" className="bg-gray-800 text-white">Select industry</option>
           <option value="technology" className="bg-gray-800 text-white">Technology</option>
           <option value="healthcare" className="bg-gray-800 text-white">Healthcare</option>
           <option value="finance" className="bg-gray-800 text-white">Finance</option>
           <option value="retail" className="bg-gray-800 text-white">Retail</option>
           <option value="manufacturing" className="bg-gray-800 text-white">Manufacturing</option>
           <option value="education" className="bg-gray-800 text-white">Education</option>
           <option value="consulting" className="bg-gray-800 text-white">Consulting</option>
           <option value="other" className="bg-gray-800 text-white">Other</option>
         </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-green-200 mb-2">
          Company Size *
        </label>
                          <select
           value={formData.companySize}
           onChange={(e) => handleInputChange('companySize', e.target.value)}
           className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
         >
           <option value="" className="bg-gray-800 text-white">Select company size</option>
           <option value="1-10" className="bg-gray-800 text-white">1-10 employees</option>
           <option value="11-50" className="bg-gray-800 text-white">11-50 employees</option>
           <option value="51-200" className="bg-gray-800 text-white">51-200 employees</option>
           <option value="201-1000" className="bg-gray-800 text-white">201-1000 employees</option>
           <option value="1000+" className="bg-gray-800 text-white">1000+ employees</option>
         </select>
      </div>

      <button
        onClick={handleNextStep}
        disabled={!formData.businessName || !formData.businessType || !formData.industry || !formData.companySize}
        className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        Next Step
      </button>
    </div>
  );

     const renderContactInfoStep = () => (
     <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            First Name *
          </label>
                     <input
             type="text"
             value={formData.firstName}
             onChange={(e) => handleInputChange('firstName', e.target.value)}
             className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
             placeholder="First name"
           />
        </div>
        <div>
          <label className="block text-sm font-medium text-green-200 mb-2">
            Last Name *
          </label>
                     <input
             type="text"
             value={formData.lastName}
             onChange={(e) => handleInputChange('lastName', e.target.value)}
             className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
             placeholder="Last name"
           />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-green-200 mb-2">
          Email Address *
        </label>
                 <input
           type="email"
           value={formData.email}
           onChange={(e) => handleInputChange('email', e.target.value)}
           className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
           placeholder="your.email@company.com"
         />
      </div>

      <div>
        <label className="block text-sm font-medium text-green-200 mb-2">
          Phone Number
        </label>
                 <input
           type="tel"
           value={formData.phone}
           onChange={(e) => handleInputChange('phone', e.target.value)}
           className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent backdrop-blur-sm"
           placeholder="+1 (555) 123-4567"
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
          disabled={!formData.firstName || !formData.lastName || !formData.email}
          className="flex-1 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Next Step
        </button>
      </div>
    </div>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <h4 className="text-green-200 font-medium mb-2">Ready to create your account?</h4>
        <ul className="text-sm text-green-300 space-y-1">
          <li>• You'll be redirected to Marcoby IAM for secure account creation</li>
          <li>• Your business information will be used to set up your Nexus workspace</li>
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
              <span className="animate-pulse">Redirecting to Marcoby...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Create Account with Marcoby
            </>
          )}
        </button>
      </div>
    </div>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 'business-info':
        return 'Tell us about your business';
      case 'contact-info':
        return 'Your contact information';
      case 'verification':
        return 'Complete registration with Marcoby';
      default:
        return 'Sign up for Nexus';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'business-info':
        return 'Help us understand your business needs to provide the best experience';
      case 'contact-info':
        return 'We\'ll use this information to set up your account and keep you updated';
      case 'verification':
        return 'Complete your registration through Marcoby IAM for secure access';
      default:
        return 'Join thousands of businesses using Nexus to grow and succeed';
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
        <div className={`w-full max-w-md transform transition-all duration-700 ease-out ${
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

                     {/* Signup card */}
           <div className="backdrop-blur-2xl bg-black/40 border border-white/40 rounded-3xl shadow-2xl p-10">
                         <div className="text-center mb-8">
               <h2 className="text-2xl font-bold text-white mb-3">
                 {getStepTitle()}
               </h2>
               <p className="text-green-200 text-sm">
                 {getStepDescription()}
               </p>
             </div>

            {renderStepIndicator()}

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

                         <div className="space-y-8">
               {currentStep === 'business-info' && renderBusinessInfoStep()}
               {currentStep === 'contact-info' && renderContactInfoStep()}
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
    </div>
  );
}
