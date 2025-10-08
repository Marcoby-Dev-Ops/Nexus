import React, { useState } from 'react';
import { GoalOrientedChat } from '../components/GoalOrientedChat';
import { useGoalOrientedAI } from '../hooks/useGoalOrientedAI';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

/**
 * Example integration showing different ways to use the goal-oriented AI system
 */
export function GoalOrientedIntegration() {
  const [activeTab, setActiveTab] = useState('full-chat');
  const [tenantId] = useState('demo-tenant');
  const [userId] = useState('demo-user');
  const [conversationId] = useState('demo-conversation');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Goal-Oriented AI Integration</h1>
        <p className="text-muted-foreground">
          Examples of how to integrate the goal-oriented AI system with your existing Nexus components
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="full-chat">Full Chat Component</TabsTrigger>
          <TabsTrigger value="hook-only">Hook Only</TabsTrigger>
          <TabsTrigger value="service-only">Service Only</TabsTrigger>
        </TabsList>

        <TabsContent value="full-chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full Goal-Oriented Chat Component</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete chat interface with goal progress tracking and tactic transparency
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <GoalOrientedChat
                  tenantId={tenantId}
                  userId={userId}
                  conversationId={conversationId}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hook-only" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Using the Hook Directly</CardTitle>
              <p className="text-sm text-muted-foreground">
                Custom UI with goal-oriented AI logic using the hook
              </p>
            </CardHeader>
            <CardContent>
              <HookOnlyExample 
                tenantId={tenantId}
                userId={userId}
                conversationId={conversationId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-only" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Using the Service Directly</CardTitle>
              <p className="text-sm text-muted-foreground">
                Direct service integration for custom workflows
              </p>
            </CardHeader>
            <CardContent>
              <ServiceOnlyExample 
                tenantId={tenantId}
                userId={userId}
                conversationId={conversationId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Example using the hook with custom UI
 */
function HookOnlyExample({ 
  tenantId, 
  userId, 
  conversationId 
}: { 
  tenantId: string; 
  userId: string; 
  conversationId: string; 
}) {
  const { 
    messages, 
    progress, 
    loading, 
    error, 
    sendMessage, 
    turn, 
    resetConversation 
  } = useGoalOrientedAI(tenantId, userId, conversationId);

  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleQuickTurn = async () => {
    try {
      const response = await turn("I want to improve my sales process", "");
      console.log('Quick turn response:', response);
    } catch (error) {
      console.error('Quick turn error:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Display */}
      <div className="flex flex-wrap gap-2">
        {progress && (
          <>
            <Badge variant="outline">
              Progress: {progress.completedGoals}/{progress.totalGoals}
            </Badge>
            <Badge variant="outline">
              Satisfaction: {Math.round(progress.satisfaction * 100)}%
            </Badge>
            {progress.tactic && (
              <Badge variant="secondary">
                Tactic: {progress.tactic}
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button onClick={handleQuickTurn} disabled={loading}>
          Quick Turn Test
        </Button>
        <Button onClick={resetConversation} variant="outline" disabled={loading}>
          Reset
        </Button>
      </div>

      {/* Messages */}
      <div className="border rounded-lg p-4 h-64 overflow-auto space-y-2">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No messages yet. Start a conversation!
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              {message.tactic && (
                <div className="text-xs opacity-70 mt-1">
                  Tactic: {message.tactic}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={loading}
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <Button onClick={handleSend} disabled={!input.trim() || loading}>
          Send
        </Button>
      </div>
    </div>
  );
}

/**
 * Example using the service directly
 */
function ServiceOnlyExample({ 
  tenantId, 
  userId, 
  conversationId 
}: { 
  tenantId: string; 
  userId: string; 
  conversationId: string; 
}) {
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleServiceCall = async () => {
    setLoading(true);
    try {
      // Import the service dynamically to avoid SSR issues
      const { GoalOrientedAIService } = await import('../services/GoalOrientedAIService');
      const service = new GoalOrientedAIService();
      
      const result = await service.turn({
        conversationId,
        userUtterance: "I need help with business strategy",
        context: "User is a small business owner looking to scale",
        tenantId,
        userId
      });

      if (result.success && result.data) {
        setResponse(JSON.stringify(result.data, null, 2));
      } else {
        setResponse(`Error: ${result.error}`);
      }
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={handleServiceCall} disabled={loading}>
        {loading ? 'Calling Service...' : 'Test Service Call'}
      </Button>

      {response && (
        <div className="border rounded-lg p-4">
          <h4 className="font-semibold mb-2">Service Response:</h4>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
