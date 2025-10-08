import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Brain, Lightbulb, Target, BarChart3, Clock, Mic, MicOff, Copy, ThumbsUp, ThumbsDown, Activity, Users } from 'lucide-react';
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  visualizations?: any[];
  actionItems?: any[];
  followUpQuestions?: string[];
  processingTime?: number;
}

interface ConversationStats {
  totalQueries: number;
  averageConfidence: number;
  averageResponseTime: number;
  successRate: number;
}

export const NaturalLanguageInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationStats, setConversationStats] = useState<ConversationStats>({
    totalQueries: 0,
    averageConfidence: 0,
    averageResponseTime: 0,
    successRate: 0
  });
  const [suggestions] = useState([
    "How is our sales team performing this month?",
    "What should we focus on to improve efficiency?",
    "Show me our customer satisfaction trends",
    "Compare this quarter to last quarter",
    "Why did our conversion rate drop?",
    "Predict our revenue for next month"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: "👋 Hi! I'm your AI business assistant powered by the Nexus Unified Brain. I can help you analyze your business data, optimize processes, make predictions, and answer questions in plain English. What would you like to know?",
        timestamp: new Date(),
        confidence: 1.0,
        followUpQuestions: [
          "How is my business performing?",
          "What should I optimize first?",
          "Show me my key metrics"
        ]
      }
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate AI response
    const response = await generateAIResponse(userMessage.content);
    
    setMessages(prev => [...prev, response]);
    setIsProcessing(false);
    
    // Update stats
    updateConversationStats(response);
  };

  const generateAIResponse = async (query: string): Promise<Message> => {
    const startTime = Date.now();
    
    // Simulate natural language processing
    const intent = analyzeIntent(query);
    const response = generateResponse(query, intent);
    
    const processingTime = Date.now() - startTime;
    
    return {
      id: `assistant_${Date.now()}`,
      type: 'assistant',
      content: response.content,
      timestamp: new Date(),
      confidence: response.confidence,
      visualizations: response.visualizations,
      actionItems: response.actionItems,
      followUpQuestions: response.followUpQuestions,
      processingTime
    };
  };

  const analyzeIntent = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('perform') || lowerQuery.includes('doing')) return 'analytics';
    if (lowerQuery.includes('improve') || lowerQuery.includes('optimize')) return 'optimization';
    if (lowerQuery.includes('predict') || lowerQuery.includes('forecast')) return 'prediction';
    if (lowerQuery.includes('compare')) return 'comparison';
    if (lowerQuery.includes('why')) return 'explanation';
    if (lowerQuery.includes('should') || lowerQuery.includes('recommend')) return 'recommendation';
    if (lowerQuery.includes('show') || lowerQuery.includes('display')) return 'display';
    
    return 'general';
  };

  const generateResponse = (query: string, intent: string) => {
    const responses: Record<string, any> = {
      analytics: {
        content: `📊 **Performance Analysis**

Based on your current business data, here's what I found: **Key Highlights:**
• **Sales Performance**: Up 23% compared to last month
• **Customer Satisfaction**: 4.8/5 (excellent trend)
• **Operational Efficiency**: 87% (above target)
• **Revenue Growth**: $45,000 increase this quarter

**Brain Insights: **
The unified brain has identified that your recent process optimizations are driving the performance improvements. Your automation implementations have reduced manual work by 34% while maintaining quality standards.

**Recommendations:**
1. **Continue Current Strategy** - Your optimization efforts are paying off
2. **Scale Successful Processes** - Apply working methods to other departments
3. **Monitor Quality Metrics** - Ensure growth doesn't compromise standards`,
        confidence: 0.92,
        visualizations: [
          { type: 'chart', title: 'Revenue Trend', data: 'trending_up' },
          { type: 'metric', title: 'Efficiency Score', value: '87%' }
        ],
        actionItems: [
          { title: 'Review top performing processes', priority: 'medium' },
          { title: 'Plan scaling strategy', priority: 'high' }
        ],
        followUpQuestions: [
          "Which specific metrics would you like to dive deeper into?",
          "How can we replicate this success in other areas?",
          "What time period should I analyze next?"
        ]
      },
      optimization: {
        content: `⚡ **Optimization Opportunities**

I've analyzed your workflows and found several high-impact optimization opportunities:

**Top Recommendations:**
1. **Automate Lead Scoring** (Sales)
   - Potential: 60% time reduction
   - Impact: $8,000/month savings
   - Timeline: 2 weeks

2. **Parallel Campaign Setup** (Marketing)
   - Potential: 35% faster launches
   - Impact: 15% more campaigns per quarter
   - Timeline: 1 week

3. **Streamline Approval Process** (Operations)
   - Potential: 45% faster decisions
   - Impact: Improved customer satisfaction
   - Timeline: 3 weeks

**Brain Analysis:**
The unified brain has identified that your biggest bottlenecks are in manual processes that have high automation potential. Implementing these optimizations could save 12+ hours per week across your team.`,
        confidence: 0.89,
        visualizations: [
          { type: 'workflow', title: 'Optimization Impact', data: 'improvement_chart' }
        ],
        actionItems: [
          { title: 'Implement lead scoring automation', priority: 'high' },
          { title: 'Design parallel campaign workflow', priority: 'medium' }
        ],
        followUpQuestions: [
          "Which optimization should we prioritize first?",
          "Do you want to see the detailed implementation plan?",
          "How much time can your team dedicate to these improvements?"
        ]
      },
      prediction: {
        content: `🔮 **Business Predictions**

Based on historical data and current trends, here are my forecasts: **Revenue Forecast (Next Quarter):**
• **Most Likely**: $187,000 (confidence: 87%)
• **Optimistic**: $205,000 (if current growth continues)
• **Conservative**: $172,000 (accounting for market factors)

**Key Drivers: **
• Customer acquisition rate: +15% projected
• Average deal size: Stable with slight growth
• Churn rate: Expected to decrease by 8%

**Market Factors:**
The AI models show positive indicators across your industry, with seasonal trends favoring your business model in the coming months.

**Confidence Factors: **
✅ Strong historical pattern recognition (94%)
✅ Stable customer behavior trends (91%)
✅ Positive market indicators (78%)`,
        confidence: 0.87,
        visualizations: [
          { type: 'chart', title: 'Revenue Forecast', data: 'prediction_chart' },
          { type: 'metric', title: 'Confidence Level', value: '87%' }
        ],
        actionItems: [
          { title: 'Prepare for increased demand', priority: 'medium' },
          { title: 'Review resource allocation', priority: 'low' }
        ],
        followUpQuestions: [
          "What factors could influence these predictions?",
          "How should we prepare for the forecasted growth?",
          "Would you like predictions for specific metrics?"
        ]
      },
      comparison: {
        content: `📈 **Comparative Analysis**

Here's how your current performance compares:

**This Month vs Last Month:**
• Revenue: +23% ($45,000 → $55,350)
• Customer Acquisition: +18% (45 → 53 customers)
• Conversion Rate: +12% (2.4% → 2.7%)
• Customer Satisfaction: +5% (4.6 → 4.8/5)

**vs Industry Average: **
• Revenue Growth: **Above Average** (+23% vs +8% industry)
• Customer Retention: **Excellent** (94% vs 85% industry)
• Operational Efficiency: **Leading** (87% vs 72% industry)

**Key Insights: **
Your business is outperforming industry benchmarks across all major metrics. The unified brain attributes this to your recent optimization efforts and strong customer focus.`,
        confidence: 0.91,
        visualizations: [
          { type: 'comparison', title: 'Performance vs Industry', data: 'benchmark_chart' }
        ],
        actionItems: [
          { title: 'Document successful strategies', priority: 'medium' },
          { title: 'Share best practices with team', priority: 'low' }
        ],
        followUpQuestions: [
          "What's driving our outperformance?",
          "How can we maintain this competitive advantage?",
          "Which specific areas should we compare next?"
        ]
      },
      explanation: {
        content: `🤔 **Analysis & Explanation**

Let me break down what's happening in your business:

**Root Cause Analysis:**
The patterns I'm seeing suggest that recent changes in your processes are having a positive compound effect. Here's what's driving the results:

**Primary Factors:**
1. **Process Automation** (40% impact)
   - Reduced manual errors by 67%
   - Freed up 12 hours/week for strategic work
   
2. **Team Training** (30% impact)
   - Improved efficiency scores across departments
   - Better customer interaction quality

3. **Technology Integration** (20% impact)
   - Faster response times
   - Better data visibility

**Secondary Factors: **
• Market conditions favorable (+10% industry growth)
• Seasonal trends supporting your business model
• Customer loyalty programs showing strong ROI

**Brain Insights: **
The unified brain has identified this as a virtuous cycle - improvements in one area are amplifying benefits in others.`,
        confidence: 0.85,
        visualizations: [
          { type: 'diagram', title: 'Factor Impact Analysis', data: 'cause_effect' }
        ],
        actionItems: [
          { title: 'Continue current improvement trajectory', priority: 'high' },
          { title: 'Monitor key success factors', priority: 'medium' }
        ],
        followUpQuestions: [
          "How can we accelerate these positive trends?",
          "What risks should we watch for?",
          "Which factor should we focus on strengthening?"
        ]
      },
      recommendation: {
        content: `💡 **Strategic Recommendations**

Based on your business context and current performance, here's what you should focus on: **Immediate Actions (Next 2 Weeks):**
1. **Implement Lead Scoring Automation**
   - Expected Impact: 60% time savings in sales
   - Resources Needed: 1 developer, 1 sales manager
   - ROI: 340% within 3 months

2. **Optimize Customer Onboarding**
   - Expected Impact: 25% faster time-to-value
   - Resources Needed: Customer success team + templates
   - ROI: Improved retention, higher satisfaction

**Medium-term Goals (Next Quarter):**
• Scale successful processes to other departments
• Implement advanced analytics dashboard
• Develop customer advocacy program

**Long-term Vision (6-12 months):**
• Full workflow automation across core processes
• Predictive customer success interventions
• Market expansion based on current success patterns

**Brain Recommendation Priority: **
The unified brain suggests focusing on automation first, as it has the highest confidence score (94%) and fastest ROI.`,
        confidence: 0.94,
        visualizations: [
          { type: 'roadmap', title: 'Strategic Timeline', data: 'recommendation_timeline' }
        ],
        actionItems: [
          { title: 'Start lead scoring automation project', priority: 'high' },
          { title: 'Design onboarding optimization plan', priority: 'high' },
          { title: 'Schedule quarterly strategy review', priority: 'medium' }
        ],
        followUpQuestions: [
          "Which recommendation should we start with?",
          "What resources do we need to allocate?",
          "How should we measure success?"
        ]
      },
      display: {
        content: `📋 **Data Display**

Here's the information you requested:

**Current Metrics Dashboard:**
• **Revenue**: $55,350 (↑23% vs last month)
• **Active Customers**: 342 (↑18% growth)
• **Conversion Rate**: 2.7% (↑12% improvement)
• **Customer Satisfaction**: 4.8/5 (↑5% increase)
• **Team Efficiency**: 87% (↑15% optimization)

**Department Performance: **
• **Sales**: Exceeding targets by 23%
• **Marketing**: Campaign ROI up 34%
• **Operations**: 87% efficiency score
• **Customer Success**: 94% retention rate

**Recent Activity:**
• 3 workflow optimizations completed this week
• 2 automation projects in progress
• 15 new customers onboarded successfully
• 0 critical issues or bottlenecks

The unified brain shows all systems operating at optimal levels with strong positive trends across all key metrics.`,
        confidence: 0.96,
        visualizations: [
          { type: 'dashboard', title: 'Live Metrics', data: 'current_metrics' },
          { type: 'table', title: 'Department Breakdown', data: 'dept_performance' }
        ],
        actionItems: [
          { title: 'Review metric trends weekly', priority: 'low' },
          { title: 'Set up automated reporting', priority: 'medium' }
        ],
        followUpQuestions: [
          "Which metrics would you like to explore further?",
          "Should I set up automated alerts for any metrics?",
          "What time period would you like to analyze?"
        ]
      },
      general: {
        content: `🤖 **I'm here to help!**

I can assist you with many aspects of your business using the Nexus Unified Brain. Here are some things I can help with:

**Analytics & Insights:**
• Performance analysis across all departments
• Trend identification and pattern recognition
• Metric tracking and benchmarking

**Optimization & Recommendations:**
• Workflow improvement suggestions
• Process automation opportunities
• Resource allocation optimization

**Predictions & Forecasting:**
• Revenue and growth projections
• Customer behavior predictions
• Market trend analysis

**Explanations & Deep Dives:**
• Root cause analysis for any issues
• Success factor identification
• Business intelligence insights

**What would you like to explore?** Just ask me in plain English - no need for technical jargon!`,
        confidence: 0.8,
        visualizations: [],
        actionItems: [],
        followUpQuestions: [
          "How is my business performing overall?",
          "What should I optimize to improve efficiency?",
          "Can you predict my revenue for next month?",
          "Show me my key performance metrics"
        ]
      }
    };

    return responses[intent] || responses.general;
  };

  const updateConversationStats = (message: Message) => {
    setConversationStats(prev => ({
      totalQueries: prev.totalQueries + 1,
      averageConfidence: (prev.averageConfidence * prev.totalQueries + (message.confidence || 0)) / (prev.totalQueries + 1),
      averageResponseTime: (prev.averageResponseTime * prev.totalQueries + (message.processingTime || 0)) / (prev.totalQueries + 1),
      successRate: (prev.successRate * prev.totalQueries + ((message.confidence || 0) > 0.7 ? 1: 0)) / (prev.totalQueries + 1)
    }));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center space-x-4">
            <MessageCircle className="w-10 h-10 text-primary" />
            <span>Natural Language Business Interface</span>
            <Brain className="w-10 h-10 text-secondary" />
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Ask questions about your business in plain English. The Nexus Unified Brain will analyze your data 
            and provide intelligent insights, recommendations, and predictions.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-card rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-2 md: grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{conversationStats.totalQueries}</div>
              <div className="text-sm text-muted-foreground">Total Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {Math.round(conversationStats.averageConfidence * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {Math.round(conversationStats.averageResponseTime)}ms
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {Math.round(conversationStats.successRate * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg: grid-cols-4 gap-6">
          {/* Suggestions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-xl p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                <span>Try asking...</span>
              </h3>
              
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-4 rounded-lg bg-background hover: bg-primary/5 hover:border-border border border-transparent transition-all text-sm text-foreground/90 hover:text-primary"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Brain className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">AI Powered</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Powered by the Nexus Unified Business Brain with 20+ years of business expertise
                </p>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg: col-span-3">
            <div className="bg-card rounded-2xl shadow-xl h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl rounded-2xl p-4 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-3">
                          <Brain className="w-5 h-5 text-primary" />
                          <span className="font-medium text-primary">Nexus AI</span>
                          {message.confidence && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {Math.round(message.confidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>

                      {message.visualizations && message.visualizations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {message.visualizations.map((viz, index) => (
                            <div key={index} className="bg-primary/5 rounded-lg p-4">
                              <div className="flex items-center space-x-2">
                                <BarChart3 className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium text-primary">{viz.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.actionItems && message.actionItems.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-medium text-foreground/90 flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>Action Items: </span>
                          </div>
                          {message.actionItems.map((item, index) => (
                            <div key={index} className="bg-warning/10 rounded-lg p-2">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  item.priority === 'high' ? 'bg-destructive' :
                                  item.priority === 'medium' ? 'bg-warning' : 'bg-success'
                                }`}></div>
                                <span className="text-sm text-foreground/90">{item.title}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-medium text-foreground/90">Follow-up questions: </div>
                          {message.followUpQuestions.map((question, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(question)}
                              className="block w-full text-left text-sm text-primary hover: text-primary hover:bg-primary/5 p-2 rounded transition-colors"
                            >
                              • {question}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          {message.processingTime && (
                            <>
                              <span>•</span>
                              <span>{message.processingTime}ms</span>
                            </>
                          )}
                        </div>
                        
                        {message.type === 'assistant' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(message.content)}
                              className="text-muted-foreground hover: text-muted-foreground"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button className="text-muted-foreground hover:text-success">
                              <ThumbsUp className="w-4 h-4" />
                            </button>
                            <button className="text-muted-foreground hover:text-destructive">
                              <ThumbsDown className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl p-4 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-primary animate-pulse" />
                        <span className="text-muted-foreground">Analyzing your query...</span>
                      </div>
                      <div className="flex space-x-1 mt-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-border p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about your business..."
                      className="w-full px-4 py-3 border border-border rounded-xl focus: ring-2 focus:ring-blue-500 focus:border-primary pr-12"
                      disabled={isProcessing}
                    />
                    <button
                      onClick={() => setIsListening(!isListening)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                        isListening ? 'text-destructive bg-destructive/5' : 'text-muted-foreground hover: text-muted-foreground'
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isProcessing}
                    className="bg-primary hover: bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-primary-foreground p-4 rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-success" />
                      <span>Brain Active</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-primary" />
                      <span>{conversationStats.totalQueries} queries</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
