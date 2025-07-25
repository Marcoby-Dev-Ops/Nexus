import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Lightbulb, 
  Map, 
  Play, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Switch } from '@/shared/components/ui/Switch';
import { Label } from '@/shared/components/ui/Label';
import { Progress } from '@/shared/components/ui/Progress';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { thoughtsService } from '@/services/help-center/thoughtsService';
import type { Thought } from '@/core/types/thoughts';

interface FireCyclePhase {
  id: 'focus' | 'insight' | 'roadmap' | 'execute';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  progress: number;
  count: number;
}

interface FireCycleThought extends Thought {
  firePhase: 'focus' | 'insight' | 'roadmap' | 'execute';
  confidence: number;
  suggestedActions: string[];
  lastActivity: Date;
  isStuck: boolean;
  daysInPhase: number;
}

interface FireCycleDashboardProps {
  className?: string;
  selectedPhase?: 'focus' | 'insight' | 'roadmap' | 'execute';
  onThoughtCreated?: (thoughtId: string) => void;
  onPhaseChange?: (phase: 'focus' | 'insight' | 'roadmap' | 'execute') => void;
}

const FIRE_PHASES: FireCyclePhase[] = [
  {
    id: 'focus',
    label: 'Focus',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Clarifying the core idea or goal',
    progress: 0,
    count: 0
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: Lightbulb,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Gaining deeper understanding and context',
    progress: 0,
    count: 0
  },
  {
    id: 'roadmap',
    label: 'Roadmap',
    icon: Map,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Planning the path forward',
    progress: 0,
    count: 0
  },
  {
    id: 'execute',
    label: 'Execute',
    icon: Play,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    description: 'Taking action and implementing',
    progress: 0,
    count: 0
  }
];

export const FireCycleDashboard: React.FC<FireCycleDashboardProps> = ({
  className = '',
  selectedPhase,
  onThoughtCreated,
  onPhaseChange
}) => {
  const { user } = useAuth();
  const [thoughts, setThoughts] = useState<FireCycleThought[]>([]);
  const [filteredThoughts, setFilteredThoughts] = useState<FireCycleThought[]>([]);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'stuck' | 'reminder' | 'achievement';
    message: string;
    thoughtId?: string;
    timestamp: Date;
    read: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPhaseState, setSelectedPhaseState] = useState<'focus' | 'insight' | 'roadmap' | 'execute' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingThought, setEditingThought] = useState<FireCycleThought | null>(null);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [nlpUpdatesEnabled, setNlpUpdatesEnabled] = useState(true);

  // Use selectedPhase prop if provided, otherwise use internal state
  const currentSelectedPhase = selectedPhase || selectedPhaseState;

  // Load thoughts and enrich with FIRE cycle data
  const loadThoughts = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await thoughtsService.getThoughts({}, 100, 0);
      const enrichedThoughts: FireCycleThought[] = response.thoughts.map(thought => ({
        ...thought,
        firePhase: determineFirePhase(thought.content),
        confidence: calculateConfidence(thought.content),
        suggestedActions: generateSuggestedActions(thought.content),
        lastActivity: new Date(thought.lastupdated),
        isStuck: isThoughtStuck(thought),
        daysInPhase: calculateDaysInPhase(thought)
      }));
      
      setThoughts(enrichedThoughts);
    } catch (error) {
      console.error('Failed to load thoughts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Filter thoughts based on selected phase and search query
  useEffect(() => {
    let filtered = thoughts;
    
    if (currentSelectedPhase !== 'all') {
      filtered = filtered.filter(t => t.firePhase === currentSelectedPhase);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.status?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredThoughts(filtered);
  }, [thoughts, currentSelectedPhase, searchQuery]);

  // Check for stuck thoughts and generate notifications
  useEffect(() => {
    const stuckThoughts = thoughts.filter(t => t.isStuck);
    const newNotifications = stuckThoughts.map(thought => ({
      id: `stuck-${thought.id}`,
      type: 'stuck' as const,
      message: `"${thought.content.substring(0, 50)}..." has been in ${thought.firePhase} phase for ${thought.daysInPhase} days`,
      thoughtId: thought.id,
      timestamp: new Date(),
      read: false
    }));
    
    setNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const newOnes = newNotifications.filter(n => !existingIds.has(n.id));
      return [...prev, ...newOnes];
    });
  }, [thoughts]);

  // Load data on mount
  useEffect(() => {
    loadThoughts();
  }, [loadThoughts]);

  // Helper functions
  const determineFirePhase = (content: string): 'focus' | 'insight' | 'roadmap' | 'execute' => {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('want') || lowerContent.includes('need') || lowerContent.includes('should')) {
      return 'focus';
    }
    if (lowerContent.includes('believe') || lowerContent.includes('think') || lowerContent.includes('could')) {
      return 'insight';
    }
    if (lowerContent.includes('plan') || lowerContent.includes('going to') || lowerContent.includes('will')) {
      return 'roadmap';
    }
    if (lowerContent.includes('start') || lowerContent.includes('begin') || lowerContent.includes('implement')) {
      return 'execute';
    }
    
    return 'focus';
  };

  const calculateConfidence = (content: string): number => {
    // Simple confidence calculation based on content length and keywords
    const keywords = ['want', 'need', 'plan', 'start', 'implement', 'goal', 'objective'];
    const foundKeywords = keywords.filter(keyword => content.toLowerCase().includes(keyword)).length;
    return Math.min(0.3 + (foundKeywords * 0.1) + (content.length > 50 ? 0.2 : 0), 1);
  };

  const generateSuggestedActions = (content: string): string[] => {
    const phase = determineFirePhase(content);
    switch (phase) {
      case 'focus':
        return ['Define clear success criteria', 'Identify key stakeholders', 'Set timeline and milestones'];
      case 'insight':
        return ['Analyze data and patterns', 'Identify root causes', 'Document key learnings'];
      case 'roadmap':
        return ['Break down into actionable steps', 'Assign responsibilities', 'Create detailed timeline'];
      case 'execute':
        return ['Start with highest priority action', 'Track progress and measure outcomes', 'Adjust plan based on results'];
      default:
        return ['Review and refine the idea'];
    }
  };

  const isThoughtStuck = (thought: Thought): boolean => {
    const daysSinceUpdate = (Date.now() - new Date(thought.lastupdated).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 7; // Stuck if no activity for 7+ days
  };

  const calculateDaysInPhase = (thought: Thought): number => {
    const daysSinceUpdate = (Date.now() - new Date(thought.lastupdated).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(daysSinceUpdate);
  };

  // Handle phase advancement
  const handleAdvancePhase = async (thoughtId: string, newPhase: 'focus' | 'insight' | 'roadmap' | 'execute') => {
    try {
      const thought = thoughts.find(t => t.id === thoughtId);
      if (!thought) return;

      await thoughtsService.updateThought({
        id: thoughtId,
        content: thought.content,
        status: newPhase === 'execute' ? 'in_progress' : 'concept',
        // Add phase-specific metadata
        ai_clarification_data: {
          ...thought.ai_clarification_data,
          firePhase: newPhase,
          phaseChangedAt: new Date().toISOString(),
          previousPhase: thought.firePhase
        }
      });

      // Reload thoughts to reflect changes
      await loadThoughts();
      onPhaseChange?.(newPhase);
    } catch (error) {
      console.error('Failed to advance phase:', error);
    }
  };

  // Handle thought creation
  const handleCreateThought = async (content: string, firePhase: 'focus' | 'insight' | 'roadmap' | 'execute') => {
    if (!user?.id) return;

    try {
      const newThought = await thoughtsService.createThought({
        content,
        status: 'in_progress',
        priority: 'medium',
        category: 'idea'
      });
      
      const enrichedThought: FireCycleThought = {
        ...newThought,
        firePhase,
        confidence: calculateConfidence(content),
        suggestedActions: generateSuggestedActions(content),
        lastActivity: new Date(),
        isStuck: false,
        daysInPhase: 0
      };
      
      setThoughts(prev => [enrichedThought, ...prev]);
      onThoughtCreated?.(newThought.id);
    } catch (error) {
      console.error('Failed to create thought:', error);
    }
  };

  // Handle thought editing
  const handleEditThought = async (thought: FireCycleThought) => {
    try {
      await thoughtsService.updateThought({
        id: thought.id,
        content: thought.content,
        category: thought.category,
        status: thought.status,
        priority: thought.priority,
        estimated_effort: thought.estimated_effort
      });
      
      await loadThoughts();
      setShowEditDialog(false);
      setEditingThought(null);
    } catch (error) {
      console.error('Failed to edit thought:', error);
    }
  };

  // Handle thought deletion
  const handleDeleteThought = async (thoughtId: string) => {
    try {
      await thoughtsService.deleteThought(thoughtId);
      await loadThoughts();
    } catch (error) {
      console.error('Failed to delete thought:', error);
    }
  };

  // Handle notification dismissal
  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'focus': return Target;
      case 'insight': return Lightbulb;
      case 'roadmap': return Map;
      case 'execute': return Play;
      default: return Sparkles;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'focus': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'insight': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'roadmap': return 'bg-green-100 text-green-800 border-green-200';
      case 'execute': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'concept': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">FIRE Cycle Dashboard</h2>
          <p className="text-muted-foreground">
            Transform your ideas into actionable plans through the FIRE framework
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Thought
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {notifications.slice(0, 3).map(notification => (
                <div key={notification.id} className="flex items-center justify-between">
                  <span>{notification.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissNotification(notification.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
              {notifications.length > 3 && (
                <span className="text-sm text-muted-foreground">
                  +{notifications.length - 3} more notifications
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Phase Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {FIRE_PHASES.map((phase) => {
          const Icon = phase.icon;
          return (
            <motion.div
              key={phase.id}
              whileHover={{ scale: 1.02 }}
              className="cursor-pointer"
              onClick={() => {
                if (selectedPhase) {
                  onPhaseChange?.(phase.id);
                } else {
                  setSelectedPhaseState(phase.id);
                }
              }}
            >
              <Card className={`border-l-4 border-l-current ${phase.color}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${phase.color}`} />
                      <CardTitle className="text-sm">{phase.label}</CardTitle>
                    </div>
                    <Badge variant="secondary">{phase.count}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{Math.round(phase.progress)}%</span>
                    </div>
                    <Progress value={phase.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{phase.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="thoughts">Thoughts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Thoughts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{thoughts.length}</div>
                <p className="text-xs text-muted-foreground">Ideas captured</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {thoughts.filter(t => t.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">Active initiatives</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {thoughts.filter(t => t.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {thoughts.slice(0, 5).map((thought) => (
                  <div key={thought.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {React.createElement(getPhaseIcon(thought.firePhase), {
                        className: 'w-4 h-4'
                      })}
                      <div>
                        <p className="text-sm font-medium">{thought.content.substring(0, 60)}...</p>
                        <p className="text-xs text-muted-foreground">
                          {thought.firePhase} phase • {thought.daysInPhase} days ago
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(thought.status)}>
                      {thought.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thoughts" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search thoughts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={currentSelectedPhase} onValueChange={(value) => {
              if (selectedPhase) {
                // If selectedPhase prop is provided, call onPhaseChange
                onPhaseChange?.(value as any);
              } else {
                // Otherwise update internal state
                setSelectedPhaseState(value as any);
              }
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by phase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="focus">Focus</SelectItem>
                <SelectItem value="insight">Insight</SelectItem>
                <SelectItem value="roadmap">Roadmap</SelectItem>
                <SelectItem value="execute">Execute</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadThoughts}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Thoughts List */}
          <div className="space-y-4">
            {filteredThoughts.map((thought) => (
              <motion.div
                key={thought.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className={`transition-all hover:shadow-md ${
                  thought.isStuck ? 'border-orange-200 bg-orange-50' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {React.createElement(getPhaseIcon(thought.firePhase), {
                          className: 'w-5 h-5'
                        })}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPhaseColor(thought.firePhase)}>
                              {thought.firePhase}
                            </Badge>
                            <Badge className={getStatusColor(thought.status)}>
                              {thought.status}
                            </Badge>
                            {thought.isStuck && (
                              <Badge variant="destructive">
                                <Clock className="w-3 h-3 mr-1" />
                                Stuck
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Confidence: {Math.round(thought.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingThought(thought);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteThought(thought.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{thought.content}</p>
                    
                    {/* Suggested Actions */}
                    {thought.suggestedActions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Actions:</p>
                        <div className="space-y-1">
                          {thought.suggestedActions.slice(0, 2).map((action, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-muted-foreground" />
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phase Advancement */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Advance to:</span>
                      {FIRE_PHASES.filter(p => p.id !== thought.firePhase).map((phase) => (
                        <Button
                          key={phase.id}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdvancePhase(thought.id, phase.id)}
                          className="text-xs"
                        >
                          {phase.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FIRE Cycle Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-advance">Auto-advance phases</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically advance thoughts when conversation updates are detected
                  </p>
                </div>
                <Switch
                  id="auto-advance"
                  checked={autoAdvanceEnabled}
                  onCheckedChange={setAutoAdvanceEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="nlp-updates">NLP conversation updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Use natural language processing to detect progress updates
                  </p>
                </div>
                <Switch
                  id="nlp-updates"
                  checked={nlpUpdatesEnabled}
                  onCheckedChange={setNlpUpdatesEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Thought Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Thought</DialogTitle>
          </DialogHeader>
          <CreateThoughtForm
            onSubmit={handleCreateThought}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Thought Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Thought</DialogTitle>
          </DialogHeader>
          {editingThought && (
            <EditThoughtForm
              thought={editingThought}
              onSubmit={handleEditThought}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingThought(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Create Thought Form Component
interface CreateThoughtFormProps {
  onSubmit: (content: string, firePhase: 'focus' | 'insight' | 'roadmap' | 'execute') => void;
  onCancel: () => void;
}

const CreateThoughtForm: React.FC<CreateThoughtFormProps> = ({ onSubmit, onCancel }) => {
  const [content, setContent] = useState('');
  const [firePhase, setFirePhase] = useState<'focus' | 'insight' | 'roadmap' | 'execute'>('focus');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), firePhase);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="content">Thought Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="fire-phase">FIRE Phase</Label>
        <Select value={firePhase} onValueChange={(value) => setFirePhase(value as any)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIRE_PHASES.map((phase) => (
              <SelectItem key={phase.id} value={phase.id}>
                {phase.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!content.trim()}>
          Create Thought
        </Button>
      </DialogFooter>
    </form>
  );
};

// Edit Thought Form Component
interface EditThoughtFormProps {
  thought: FireCycleThought;
  onSubmit: (thought: FireCycleThought) => void;
  onCancel: () => void;
}

const EditThoughtForm: React.FC<EditThoughtFormProps> = ({ thought, onSubmit, onCancel }) => {
  const [content, setContent] = useState(thought.content);
  const [status, setStatus] = useState(thought.status);
  const [priority, setPriority] = useState(thought.priority || 'medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...thought,
      content: content.trim(),
      status,
      priority
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-content">Content</Label>
        <Textarea
          id="edit-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concept">Concept</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as any)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!content.trim()}>
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}; 