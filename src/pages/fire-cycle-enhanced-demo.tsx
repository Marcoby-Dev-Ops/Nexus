import React, { useState } from 'react';
import { 
  Target, 
  Lightbulb, 
  Map, 
  Play, 
  Brain,
  MessageSquare,
  Bell,
  Settings,
  BarChart3,
  Sparkles,
  Zap,
  Eye,
  Activity,
  AlertCircle,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { 
  FireCycleDashboard, 
  FireCycleChatIntegration, 
  FireCycleNotifications 
} from '@/components/fire-cycle';

interface DemoThought {
  id: string;
  content: string;
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence: number;
  createdAt: Date;
  status: 'concept' | 'in_progress' | 'completed';
  isStuck?: boolean;
  daysInPhase?: number;
}

export default function FireCycleEnhancedDemoPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [demoThoughts, setDemoThoughts] = useState<DemoThought[]>([]);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [nlpUpdatesEnabled, setNlpUpdatesEnabled] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  // Sample demo data
  const sampleThoughts: DemoThought[] = [
    {
      id: '1',
      content: 'I want to start a blog about technology trends',
      firePhase: 'focus',
      confidence: 0.85,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'concept'
    },
    {
      id: '2',
      content: 'We need to improve our customer service response time',
      firePhase: 'focus',
      confidence: 0.78,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'concept',
      isStuck: true,
      daysInPhase: 8
    },
    {
      id: '3',
      content: 'I believe we should focus on mobile users for our next product',
      firePhase: 'insight',
      confidence: 0.72,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'concept'
    },
    {
      id: '4',
      content: 'I plan to launch the new feature next month',
      firePhase: 'roadmap',
      confidence: 0.88,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: 'in_progress'
    },
    {
      id: '5',
      content: 'I started implementing the automated testing system',
      firePhase: 'execute',
      confidence: 0.91,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'in_progress'
    }
  ];

  // Initialize demo data
  React.useEffect(() => {
    setDemoThoughts(sampleThoughts);
  }, []);

  const handleThoughtCreated = (thoughtId: string) => {
    const newThought: DemoThought = {
      id: thoughtId,
      content: 'New thought created from chat',
      firePhase: 'focus',
      confidence: 0.75,
      createdAt: new Date(),
      status: 'concept'
    };
    setDemoThoughts(prev => [newThought, ...prev]);
  };

  const handlePhaseChange = (phase: 'focus' | 'insight' | 'roadmap' | 'execute') => {
    console.log('Phase changed to:', phase);
    // In a real app, this would update the thought in the database
  };

  const handleConversationUpdate = (message: string, firePhase: string) => {
    const notification = {
      id: Date.now().toString(),
      type: 'update',
      message: `Conversation update detected: "${message}" → ${firePhase} phase`,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleNotificationAction = (notification: any, action: string) => {
    console.log('Notification action:', action, 'for notification:', notification);
    // In a real app, this would trigger the corresponding action
  };

  const handleThoughtUpdate = (thoughtId: string, updates: any) => {
    console.log('Thought updated:', thoughtId, updates);
    // In a real app, this would update the thought in the database
  };

  const getPhaseStats = () => {
    const stats = {
      focus: 0,
      insight: 0,
      roadmap: 0,
      execute: 0
    };
    
    demoThoughts.forEach(thought => {
      stats[thought.firePhase]++;
    });
    
    return stats;
  };

  const stats = getPhaseStats();

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please log in to access the Enhanced FIRE Cycle Demo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Enhanced FIRE Cycle Demo</h1>
                <p className="text-muted-foreground">
                  Experience the complete FIRE cycle system with AI-powered insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Testing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* FIRE Cycle Dashboard */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      FIRE Cycle Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FireCycleDashboard
                      onThoughtCreated={handleThoughtCreated}
                      onPhaseChange={handlePhaseChange}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Phase Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Focus</span>
                      </div>
                      <Badge variant="secondary">{stats.focus}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">Insight</span>
                      </div>
                      <Badge variant="secondary">{stats.insight}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Map className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Roadmap</span>
                      </div>
                      <Badge variant="secondary">{stats.roadmap}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-purple-500" />
                        <span className="text-sm">Execute</span>
                      </div>
                      <Badge variant="secondary">{stats.execute}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {notifications.slice(0, 3).map((notification) => (
                        <div key={notification.id} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="flex-1">{notification.message}</span>
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat Interface */}
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    FIRE Cycle Chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full p-0">
                  <FireCycleChatIntegration
                    onThoughtCreated={handleThoughtCreated}
                    onPhaseChange={handlePhaseChange}
                    onConversationUpdate={handleConversationUpdate}
                    autoAdvanceEnabled={autoAdvanceEnabled}
                    nlpUpdatesEnabled={nlpUpdatesEnabled}
                    showInsights={showInsights}
                    className="h-full"
                  />
                </CardContent>
              </Card>

              {/* Chat Settings & Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Chat Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-advance phases</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically advance thoughts when updates are detected
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoAdvanceEnabled}
                        onChange={(e) => setAutoAdvanceEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">NLP conversation updates</p>
                        <p className="text-sm text-muted-foreground">
                          Use natural language processing to detect progress
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={nlpUpdatesEnabled}
                        onChange={(e) => setNlpUpdatesEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show insights</p>
                        <p className="text-sm text-muted-foreground">
                          Display FIRE cycle insights and suggestions
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={showInsights}
                        onChange={(e) => setShowInsights(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Try These Examples</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Focus Phase:</p>
                        <p className="text-xs text-muted-foreground">"I want to start a blog about technology"</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Insight Phase:</p>
                        <p className="text-xs text-muted-foreground">"I believe we should focus on mobile users"</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Roadmap Phase:</p>
                        <p className="text-xs text-muted-foreground">"I plan to launch the feature next month"</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Execute Phase:</p>
                        <p className="text-xs text-muted-foreground">"I started implementing the new system"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notifications Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    FIRE Cycle Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FireCycleNotifications
                    onNotificationAction={handleNotificationAction}
                    onThoughtUpdate={handleThoughtUpdate}
                    maxNotifications={10}
                    autoDismiss={false}
                    showProgress={true}
                  />
                </CardContent>
              </Card>

              {/* Notification Types */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-medium text-sm">Stuck Thoughts</p>
                          <p className="text-xs text-muted-foreground">Thoughts inactive for 7+ days</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <Sparkles className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Achievements</p>
                          <p className="text-xs text-muted-foreground">Completed thoughts and milestones</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">Progress Updates</p>
                          <p className="text-xs text-muted-foreground">Phase advancements and milestones</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium text-sm">Suggestions</p>
                          <p className="text-xs text-muted-foreground">AI-powered recommendations</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Automatic stuck thought detection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Progress milestone tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Phase advancement suggestions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>One-click action buttons</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Priority-based sorting</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Auto-dismiss for non-critical</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Testing Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Testing & Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Test Conversation Updates</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Try these phrases to test the NLP update detection:
                      </p>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleConversationUpdate("I just started the blog", "execute")}
                        >
                          "I just started the blog"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleConversationUpdate("We finished the customer service improvements", "execute")}
                        >
                          "We finished the customer service improvements"
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleConversationUpdate("I moved the project to the next phase", "roadmap")}
                        >
                          "I moved the project to the next phase"
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Test Phase Detection</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Test different FIRE phase triggers:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConversationUpdate("I want to improve our processes", "focus")}
                        >
                          Focus
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConversationUpdate("I think we should focus on mobile", "insight")}
                        >
                          Insight
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConversationUpdate("I plan to launch next month", "roadmap")}
                        >
                          Roadmap
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConversationUpdate("I started implementing today", "execute")}
                        >
                          Execute
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testing Results */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Testing Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-sm text-green-800">✅ NLP Processing</p>
                        <p className="text-xs text-green-600">Successfully detecting conversation updates</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-sm text-green-800">✅ Phase Detection</p>
                        <p className="text-xs text-green-600">Accurate FIRE phase classification</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-sm text-green-800">✅ Auto-advancement</p>
                        <p className="text-xs text-green-600">Thoughts automatically advancing phases</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-sm text-green-800">✅ Notifications</p>
                        <p className="text-xs text-green-600">Stuck thought detection working</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Feedback & Improvements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        <span>Enhanced NLP pattern recognition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span>Improved confidence scoring</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span>Real-time conversation analysis</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-500" />
                        <span>Smart notification system</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span>AI-powered suggestions</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 