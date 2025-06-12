import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Textarea } from '../ui/Textarea';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Badge } from '../ui/Badge';
import { 
  User, 
  Briefcase, 
  Zap,
  MessageSquare,
  Clock,
  Target
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserContextData {
  role: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  biggest_challenge: string;
  daily_frustration: string;
  ideal_outcome: string;
  time_availability: 'minimal' | 'some' | 'focused';
  working_style: 'quick-wins' | 'deep-dive' | 'collaborative';
}

interface UserContextStepProps {
  onNext: (data: UserContextData) => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export const UserContextStep: React.FC<UserContextStepProps> = ({ onNext, onSkip, onBack }) => {
  const { user, updateProfile } = useAuth();
  const [contextData, setContextData] = useState<UserContextData>({
    role: '',
    experience_level: 'intermediate',
    biggest_challenge: '',
    daily_frustration: '',
    ideal_outcome: '',
    time_availability: 'some',
    working_style: 'quick-wins'
  });

  // Simplified, conversational role options
  const roleOptions = [
    { id: 'founder', label: 'Founder/CEO', description: 'I run the company' },
    { id: 'manager', label: 'Manager/Director', description: 'I lead a team or department' },
    { id: 'analyst', label: 'Analyst/Specialist', description: 'I work with data and insights' },
    { id: 'operations', label: 'Operations/Admin', description: 'I keep things running smoothly' },
    { id: 'sales-marketing', label: 'Sales/Marketing', description: 'I focus on growth and customers' },
    { id: 'other', label: 'Other', description: 'Something else entirely' }
  ];

  const handleSubmit = async () => {
    try {
      // Store context data
      localStorage.setItem('nexus_user_context', JSON.stringify(contextData));
      
      await updateProfile({
        role: 'user',
        preferences: {
          theme: 'system',
          notifications: true,
          language: 'en',
          user_context: contextData
        }
      });
    } catch (error) {
      console.error('Error updating user context:', error);
    }
    
    onNext(contextData);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Let's get to know you</h2>
        <p className="text-lg text-muted-foreground">
          A few quick questions so we can set up Nexus just right for you
        </p>
      </div>

      <div className="space-y-8">
        {/* Role - Conversational */}
        <Card className="border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-medium">What's your role?</CardTitle>
            <p className="text-sm text-muted-foreground">This helps us show you the most relevant features</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleOptions.map((role) => (
                <div
                  key={role.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    contextData.role === role.id 
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setContextData(prev => ({ ...prev, role: role.id }))}
                >
                  <div className="font-medium text-sm mb-1">{role.label}</div>
                  <div className="text-xs text-muted-foreground">{role.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Experience - Simplified */}
        <Card className="border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-medium">How comfortable are you with business tools?</CardTitle>
            <p className="text-sm text-muted-foreground">We'll adjust the setup complexity accordingly</p>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={contextData.experience_level}
              onValueChange={(value) => setContextData(prev => ({ 
                ...prev, 
                experience_level: value as 'beginner' | 'intermediate' | 'advanced' 
              }))}
              className="space-y-4"
            >
              <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="beginner" id="beginner" />
                <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                  <div className="font-medium">I like things simple</div>
                  <div className="text-sm text-muted-foreground">Show me the basics first</div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                  <div className="font-medium">I'm pretty tech-savvy</div>
                  <div className="text-sm text-muted-foreground">I can handle moderate complexity</div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                  <div className="font-medium">I'm a power user</div>
                  <div className="text-sm text-muted-foreground">Give me all the advanced features</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Main Challenge - Open-ended */}
        <Card className="border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-medium">What's your biggest challenge right now?</CardTitle>
            <p className="text-sm text-muted-foreground">Tell us what's keeping you up at night (business-wise)</p>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., I spend too much time creating reports instead of analyzing them, or our team uses 5 different tools and nothing talks to each other..."
              value={contextData.biggest_challenge}
              onChange={(e) => setContextData(prev => ({ ...prev, biggest_challenge: e.target.value }))}
              className="min-h-[100px] text-base"
            />
          </CardContent>
        </Card>

        {/* Ideal Outcome - Future focused */}
        <Card className="border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-medium">If Nexus works perfectly for you, what changes?</CardTitle>
            <p className="text-sm text-muted-foreground">Paint us a picture of your ideal workday</p>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., I wake up to a smart dashboard that already shows me what needs my attention, my team is automatically updated on progress, and I have time to focus on strategy instead of busy work..."
              value={contextData.ideal_outcome}
              onChange={(e) => setContextData(prev => ({ ...prev, ideal_outcome: e.target.value }))}
              className="min-h-[100px] text-base"
            />
          </CardContent>
        </Card>

        {/* Working Style - Personality based */}
        <Card className="border-none shadow-none">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg font-medium">How do you like to work?</CardTitle>
            <p className="text-sm text-muted-foreground">This helps us customize your experience</p>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={contextData.working_style}
              onValueChange={(value) => setContextData(prev => ({ 
                ...prev, 
                working_style: value as 'quick-wins' | 'deep-dive' | 'collaborative' 
              }))}
              className="space-y-4"
            >
              <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="quick-wins" id="quick-wins" />
                <Label htmlFor="quick-wins" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">I want quick wins</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Show me immediate value, keep it simple</div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="deep-dive" id="deep-dive" />
                <Label htmlFor="deep-dive" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium">I like to dive deep</span>
                  </div>
                  <div className="text-sm text-muted-foreground">I want to understand and customize everything</div>
                </Label>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="collaborative" id="collaborative" />
                <Label htmlFor="collaborative" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-success" />
                    <span className="font-medium">I'm all about teamwork</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Focus on features that help my team collaborate</div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <div className="flex gap-4 ml-auto">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            disabled={!contextData.role || contextData.biggest_challenge.length < 10}
            className="px-8"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}; 