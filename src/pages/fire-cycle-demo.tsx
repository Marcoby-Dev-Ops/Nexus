import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Target, Lightbulb, Map, Play, Sparkles, BookOpen, TrendingUp } from 'lucide-react';
import { FireCycleChatInterface } from '@/components/ai/FireCycleChatInterface';
import { useAuth } from '@/hooks/index';

interface Thought {
  id: string;
  content: string;
  firePhase: string;
  confidence: number;
  createdAt: Date;
  status: 'concept' | 'developing' | 'active' | 'completed';
}

export default function FireCycleDemoPage() {
  const { user, company } = useAuth();
  const [createdThoughts, setCreatedThoughts] = useState<Thought[]>([]);
  const [activeTab, setActiveTab] = useState('chat');

  const handleThoughtCreated = (thought: any) => {
    const newThought: Thought = {
      id: Date.now().toString(),
      content: thought.content,
      firePhase: thought.firePhase,
      confidence: thought.confidence,
      createdAt: new Date(),
      status: 'concept'
    };
    
    setCreatedThoughts(prev => [newThought, ...prev]);
    setActiveTab('thoughts');
  };

  const getFirePhaseStats = () => {
    const stats = {
      focus: 0,
      insight: 0,
      roadmap: 0,
      execute: 0
    };
    
    createdThoughts.forEach(thought => {
      stats[thought.firePhase as keyof typeof stats]++;
    });
    
    return stats;
  };

  const stats = getFirePhaseStats();

  if (!user || !company) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please log in to access the FIRE Cycle Demo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">FIRE Cycle System Demo</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience how the FIRE Cycle System captures your ideas and helps develop them into actionable plans. 
          Try saying things like "I want to start a blog" or "We need to improve our marketing strategy."
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Focus Ideas</p>
                <p className="text-2xl font-bold">{stats.focus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Insights</p>
                <p className="text-2xl font-bold">{stats.insight}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Roadmaps</p>
                <p className="text-2xl font-bold">{stats.roadmap}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Actions</p>
                <p className="text-2xl font-bold">{stats.execute}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            FIRE Chat
          </TabsTrigger>
          <TabsTrigger value="thoughts" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Captured Thoughts ({createdThoughts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <Card className="h-[600px]">
            <FireCycleChatInterface onThoughtCreated={handleThoughtCreated} />
          </Card>
        </TabsContent>

        <TabsContent value="thoughts" className="mt-6">
          <div className="space-y-4">
            {createdThoughts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No thoughts captured yet</h3>
                  <p className="text-muted-foreground">
                    Start chatting to capture your ideas and see them appear here!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {createdThoughts.map((thought) => (
                  <Card key={thought.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {thought.firePhase === 'focus' && <Target className="w-4 h-4 text-blue-500" />}
                          {thought.firePhase === 'insight' && <Lightbulb className="w-4 h-4 text-yellow-500" />}
                          {thought.firePhase === 'roadmap' && <Map className="w-4 h-4 text-green-500" />}
                          {thought.firePhase === 'execute' && <Play className="w-4 h-4 text-purple-500" />}
                          <Badge variant="outline" className="capitalize">
                            {thought.firePhase}
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round(thought.confidence * 100)}% match
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {thought.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{thought.content}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {thought.status}
                        </Badge>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Ready for development
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Example Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Try These Example Prompts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Focus Phase Examples:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• "I want to start a blog about technology"</li>
                <li>• "We need to improve our customer service"</li>
                <li>• "I'm thinking about launching a new product"</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Insight Phase Examples:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• "This is a great opportunity for our business"</li>
                <li>• "I believe we should focus on mobile users"</li>
                <li>• "We could expand into the European market"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 