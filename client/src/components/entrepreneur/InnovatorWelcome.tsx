import React, { useState } from 'react';
import { Lightbulb, Rocket, Heart, TrendingUp, CheckCircle, ArrowRight, Sparkles, Target, Zap, Brain, Star } from 'lucide-react';
interface InnovatorProfile {
  name: string;
  idea: string;
  passion: string;
  experience: 'first-time' | 'some-experience' | 'experienced';
  goals: string[];
  challenges: string[];
}

export const InnovatorWelcome: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'profile' | 'guidance'>('welcome');
  const [profile, setProfile] = useState<Partial<InnovatorProfile>>({});

  const handleStartJourney = () => {
    setCurrentStep('profile');
  };

  const handleProfileComplete = (profileData: Partial<InnovatorProfile>) => {
    setProfile(profileData);
    setCurrentStep('guidance');
  };

  if (currentStep === 'welcome') {
    return <WelcomeScreen onStart={handleStartJourney} />;
  }

  if (currentStep === 'profile') {
    return <ProfileBuilder onComplete={handleProfileComplete} />;
  }

  return <PersonalizedGuidance profile={profile} />;
};

const WelcomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Lightbulb className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Turn Your Idea Into a Business
            </h1>
            <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
              <Rocket className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            You don't need an MBA or business degree. You just need a great idea, passion, and the right guidance. 
            <strong className="text-primary"> Nexus makes business simple.</strong>
          </p>
        </div>

        {/* Main Value Proposition */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              🚀 From Idea to Thriving Business
            </h2>
            <p className="text-muted-foreground text-lg">
              We'll guide you through every step, in plain English, with no confusing business jargon.
            </p>
          </div>

          <div className="grid grid-cols-1 md: grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Start</h3>
              <p className="text-sm text-muted-foreground">
                Turn your idea into a real business plan that actually works
              </p>
            </div>

            <div className="text-center">
              <div className="bg-success/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Standardize</h3>
              <p className="text-sm text-muted-foreground">
                Build proper systems and processes that run your business for you
              </p>
            </div>

            <div className="text-center">
              <div className="bg-secondary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Operate</h3>
              <p className="text-sm text-muted-foreground">
                Run your business like a pro with AI-powered guidance every step
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-warning" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Grow</h3>
              <p className="text-sm text-muted-foreground">
                Scale your business with confidence using proven strategies
              </p>
            </div>
          </div>
        </div>

        {/* Success Stories Preview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            ✨ Real People, Real Success Stories
          </h2>
          
          <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">SJ</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-foreground">Sarah Johnson</h3>
                  <p className="text-sm text-muted-foreground">High School Teacher</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "I had an idea for educational toys but zero business experience. Nexus walked me through everything."
              </p>
              <div className="text-sm font-medium text-success">
                💰 $180K revenue in first year
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <span className="text-success font-bold">MR</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-foreground">Mike Rodriguez</h3>
                  <p className="text-sm text-muted-foreground">Construction Worker</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "Started a landscaping business with just my truck and Nexus. Now I have 8 employees."
              </p>
              <div className="text-sm font-medium text-success">
                👥 Grew from 1 to 8 employees
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <span className="text-secondary font-bold">AL</span>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-foreground">Alex Liu</h3>
                  <p className="text-sm text-muted-foreground">College Dropout</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                "Built a tech startup without knowing anything about business. Nexus was like having a business mentor 24/7."
              </p>
              <div className="text-sm font-medium text-success">
                🚀 $50K monthly recurring revenue
              </div>
            </div>
          </div>
        </div>

        {/* What Makes Nexus Different */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            🎯 Why Nexus is Perfect for Innovators Like You
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 rounded-lg p-2">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">No Business Jargon</h3>
                <p className="text-muted-foreground text-sm">
                  We explain everything in plain English. No confusing terms, no MBA-speak, just clear guidance.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-success/10 rounded-lg p-2">
                <Heart className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Built for Beginners</h3>
                <p className="text-muted-foreground text-sm">
                  Designed specifically for people starting their first business. We assume you know nothing and teach you everything.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-secondary/10 rounded-lg p-2">
                <Sparkles className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">AI-Powered Guidance</h3>
                <p className="text-muted-foreground text-sm">
                  Like having a business expert by your side 24/7, giving you advice tailored to your specific situation.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 rounded-lg p-2">
                <CheckCircle className="w-6 h-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Step-by-Step Process</h3>
                <p className="text-muted-foreground text-sm">
                  We break down everything into simple, actionable steps. No overwhelm, just clear next actions.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button
            onClick={onStart}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover: from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-4 mx-auto"
          >
            <Rocket className="w-6 h-6" />
            <span>Start Building Your Business</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          
          <p className="text-muted-foreground mt-4 text-sm">
            ✨ Free to start • No credit card required • Takes 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

const ProfileBuilder: React.FC<{ onComplete: (profile: Partial<InnovatorProfile>) => void }> = ({ onComplete }) => {
  const [profile, setProfile] = useState<Partial<InnovatorProfile>>({
    goals: [],
    challenges: []
  });

  const handleSubmit = () => {
    onComplete(profile);
  };

  const toggleGoal = (goal: string) => {
    const currentGoals = profile.goals || [];
    if (currentGoals.includes(goal)) {
      setProfile({
        ...profile,
        goals: currentGoals.filter(g => g !== goal)
      });
    } else {
      setProfile({
        ...profile,
        goals: [...currentGoals, goal]
      });
    }
  };

  const toggleChallenge = (challenge: string) => {
    const currentChallenges = profile.challenges || [];
    if (currentChallenges.includes(challenge)) {
      setProfile({
        ...profile,
        challenges: currentChallenges.filter(c => c !== challenge)
      });
    } else {
      setProfile({
        ...profile,
        challenges: [...currentChallenges, challenge]
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Let's Get to Know You Better
          </h1>
          <p className="text-muted-foreground text-lg">
            This helps us give you the most relevant guidance for your journey
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl p-8 space-y-8">
          {/* Name and Idea */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">
                What's your name?
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-border rounded-lg focus: ring-2 focus:ring-blue-500 focus:border-primary"
                placeholder="Your first name"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">
                What's your business idea? (Don't worry, keep it simple!)
              </label>
              <textarea
                className="w-full px-4 py-3 border border-border rounded-lg focus: ring-2 focus:ring-blue-500 focus:border-primary"
                rows={3}
                placeholder="e.g., I want to sell handmade jewelry online, or I have an idea for a dog walking service"
                value={profile.idea || ''}
                onChange={(e) => setProfile({ ...profile, idea: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/90 mb-2">
                What makes you passionate about this idea?
              </label>
              <textarea
                className="w-full px-4 py-3 border border-border rounded-lg focus: ring-2 focus:ring-blue-500 focus:border-primary"
                rows={2}
                placeholder="e.g., I love creating beautiful things, or I want to help busy pet owners"
                value={profile.passion || ''}
                onChange={(e) => setProfile({ ...profile, passion: e.target.value })}
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-4">
              How would you describe your business experience?
            </label>
            <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
              {[
                { value: 'first-time', label: 'First-Time Entrepreneur', desc: 'This is my first business' },
                { value: 'some-experience', label: 'Some Experience', desc: 'I\'ve tried before or have some knowledge' },
                { value: 'experienced', label: 'Experienced', desc: 'I\'ve run businesses before' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setProfile({ ...profile, experience: option.value as any })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    profile.experience === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover: border-border'
                  }`}
                >
                  <div className="font-medium text-foreground">{option.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-4">
              What are your main goals? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
              {[
                'Make money from my passion',
                'Replace my current job income',
                'Build something that helps people',
                'Have more flexibility and freedom',
                'Create a legacy for my family',
                'Prove I can do it',
                'Solve a problem I care about',
                'Build wealth over time'
              ].map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    profile.goals?.includes(goal)
                      ? 'border-success bg-success/5 text-success'
                      : 'border-border hover: border-border'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {profile.goals?.includes(goal) && <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm">{goal}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-4">
              What are your biggest concerns? (Select all that apply)
            </label>
            <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
              {[
                'I don\'t know where to start',
                'I\'m worried about money/funding',
                'I don\'t understand business terms',
                'I\'m afraid of failing',
                'I don\'t have enough time',
                'I don\'t know how to market',
                'I\'m not sure if my idea is good',
                'I don\'t know about legal stuff'
              ].map((challenge) => (
                <button
                  key={challenge}
                  onClick={() => toggleChallenge(challenge)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    profile.challenges?.includes(challenge)
                      ? 'border-orange-500 bg-orange-50 text-warning'
                      : 'border-border hover: border-border'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {profile.challenges?.includes(challenge) && <CheckCircle className="w-4 h-4" />}
                    <span className="text-sm">{challenge}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-6">
            <button
              onClick={handleSubmit}
              disabled={!profile.name || !profile.idea || !profile.experience}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover: from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-4 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-6 h-6" />
              <span>Get My Personalized Plan</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalizedGuidance: React.FC<{ profile: Partial<InnovatorProfile> }> = ({ profile }) => {
  const getPersonalizedMessage = () => {
    const name = profile.name || 'there';
    const experience = profile.experience || 'first-time';
    
    if (experience === 'first-time') {
      return `Perfect, ${name}! Starting your first business is exciting. We'll guide you through every single step, explaining everything in simple terms.`;
    } else if (experience === 'some-experience') {
      return `Great, ${name}! With some experience under your belt, we can move a bit faster and focus on the areas where you need the most help.`;
    } else {
      return `Excellent, ${name}! With your experience, we can dive into advanced strategies and help you scale efficiently.`;
    }
  };

  const getNextSteps = () => {
    const steps = [
      {
        title: 'Validate Your Idea',
        description: 'We\'ll help you test if people actually want what you\'re offering',
        icon: Lightbulb,
        color: 'blue'
      },
      {
        title: 'Create Your Business Plan',
        description: 'A simple, practical plan that actually helps you build your business',
        icon: Target,
        color: 'green'
      },
      {
        title: 'Set Up Your Business',
        description: 'Handle all the legal and administrative stuff the easy way',
        icon: CheckCircle,
        color: 'purple'
      },
      {
        title: 'Launch and Grow',
        description: 'Get your first customers and start making money',
        icon: Rocket,
        color: 'orange'
      }
    ];

    return steps;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Personalized Welcome */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-warning" />
            <h1 className="text-3xl font-bold text-foreground mx-4">
              Your Personalized Business Plan
            </h1>
            <Star className="w-8 h-8 text-warning" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {getPersonalizedMessage()}
          </p>
        </div>

        {/* Business Idea Summary */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            🚀 Your Business Idea
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-2">The Idea: </h3>
            <p className="text-foreground/90 mb-4">{profile.idea}</p>
            
            <h3 className="font-semibold text-foreground mb-2">Your Passion:</h3>
            <p className="text-foreground/90">{profile.passion}</p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-card rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            📋 Your Step-by-Step Plan
          </h2>
          
          <div className="space-y-6">
            {getNextSteps().map((step, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className={`bg-${step.color}-100 rounded-full p-4 flex-shrink-0`}>
                  <step.icon className={`w-6 h-6 text-${step.color}-600`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">
                    Step {index + 1}: {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-3">{step.description}</p>
                  <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-primary-foreground px-6 py-2 rounded-lg font-medium hover: from-blue-700 hover:to-purple-700 transition-all duration-200">
                    Start This Step
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Addressing Concerns */}
        {profile.challenges && profile.challenges.length > 0 && (
          <div className="bg-card rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              💪 We've Got Your Back
            </h2>
            <p className="text-muted-foreground mb-6">
              You mentioned these concerns. Here's how Nexus helps with each one: </p>
            
            <div className="space-y-4">
              {profile.challenges.map((challenge, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-success/5 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">"{challenge}"</h3>
                    <p className="text-sm text-muted-foreground">
                      {getChallengeResponse(challenge)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <button className="bg-gradient-to-r from-green-600 to-blue-600 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg hover: from-green-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-4 mx-auto">
            <Rocket className="w-6 h-6" />
            <span>Let's Start Building Your Business!</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          
          <p className="text-muted-foreground mt-4 text-sm">
            ✨ Your AI business mentor is ready to guide you every step of the way
          </p>
        </div>
      </div>
    </div>
  );
};

const getChallengeResponse = (challenge: string): string => {
  const responses: Record<string, string> = {
    "I don't know where to start": "We'll show you exactly where to start with a clear, step-by-step plan tailored to your idea.",
    "I'm worried about money/funding": "We'll help you start lean and show you multiple funding options when you're ready.",
    "I don't understand business terms": "We explain everything in plain English, no jargon or confusing terms.",
    "I'm afraid of failing": "We'll help you minimize risks and learn from successful entrepreneurs who started just like you.",
    "I don't have enough time": "We'll show you how to build your business in small, manageable chunks that fit your schedule.",
    "I don't know how to market": "We'll teach you simple, effective marketing strategies that don't require a big budget.",
    "I'm not sure if my idea is good": "We'll help you validate your idea with real customers before you invest too much time or money.",
    "I don't know about legal stuff": "We'll guide you through all the legal requirements and help you get set up properly."
  };
  
  return responses[challenge] || "We'll provide guidance and support to help you overcome this challenge.";
}; 
