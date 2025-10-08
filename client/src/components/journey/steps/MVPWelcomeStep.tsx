/**
 * MVP Journey - Welcome Step
 * 
 * Welcome step that introduces the MVP onboarding approach.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  Target, 
  Users, 
  Zap, 
  Building2, 
  Globe, 
  Play, 
  Rocket 
} from 'lucide-react';
import type { JourneyStepProps } from '../types';

export default function MVPWelcomeStep({ onStepComplete }: JourneyStepProps) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="flex justify-center">
          <Brain className="w-24 h-24 text-primary mb-6" />
        </div>
        
        <h1 className="text-3xl font-bold">
          Welcome to Your Business Brain
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nexus is your AI-powered business operating system that lets you execute your vision 
          without mastering every skill. You focus on goals, we handle the expertise.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 mx-auto mb-4 text-blue-600" />
            <h3 className="font-semibold mb-2">Clarity First</h3>
            <p className="text-sm text-muted-foreground">
              Every feature makes it obvious what to do next
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-4 text-green-600" />
            <h3 className="font-semibold mb-2">Delegation by Design</h3>
            <p className="text-sm text-muted-foreground">
              Easily hand off tasks to team members or AI agents
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="w-8 h-8 mx-auto mb-4 text-purple-600" />
            <h3 className="font-semibold mb-2">Execute Immediately</h3>
            <p className="text-sm text-muted-foreground">
              Turn ideas into actions without learning every domain
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">What You'll Set Up</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Building2 className="w-5 h-5 text-primary" />
            <span>Business Units (Sales, Marketing, Ops, Finance)</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
            <span>Key Integrations</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Target className="w-5 h-5 text-primary" />
            <span>Goals & KPIs</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Play className="w-5 h-5 text-primary" />
            <span>First Action</span>
          </div>
        </div>
      </div>

      <Button 
        onClick={() => onStepComplete({ completed: true, step: 'welcome' })}
        size="lg"
        className="mt-8"
      >
        <Rocket className="w-4 h-4 mr-2" />
        Start Setup
      </Button>
    </div>
  );
}
