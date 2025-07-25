import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  X,
  Zap,
  Target,
  Lightbulb,
  Map,
  Play,
  Sparkles,
  MessageSquare,
  Calendar,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Progress } from '@/shared/components/ui/Progress';
import { useAuth } from '@/hooks/index';
import { thoughtsService } from '@/services/help-center/thoughtsService';
import type { Thought } from '@/core/types/thoughts';

interface FireCycleNotification {
  id: string;
  type: 'stuck' | 'reminder' | 'achievement' | 'milestone' | 'suggestion';
  title: string;
  message: string;
  thoughtId?: string;
  firePhase?: 'focus' | 'insight' | 'roadmap' | 'execute';
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  read: boolean;
  actionRequired: boolean;
  suggestedActions?: string[];
  daysInPhase?: number;
  progressPercent?: number;
}

interface FireCycleNotificationsProps {
  className?: string;
  onNotificationAction?: (notification: FireCycleNotification, action: string) => void;
  onThoughtUpdate?: (thoughtId: string, updates: Partial<Thought>) => void;
  maxNotifications?: number;
  autoDismiss?: boolean;
  showProgress?: boolean;
}

export const FireCycleNotifications: React.FC<FireCycleNotificationsProps> = ({
  className = '',
  onNotificationAction,
  onThoughtUpdate,
  maxNotifications = 5,
  autoDismiss = true,
  showProgress = true
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<FireCycleNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load and analyze thoughts for notifications
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await thoughtsService.getThoughts({}, 100, 0);
      const thoughts = response.thoughts;
      
      const newNotifications: FireCycleNotification[] = [];

      // Analyze each thought for potential notifications
      thoughts.forEach(thought => {
        const daysSinceUpdate = calculateDaysSinceUpdate(thought);
        const firePhase = determineFirePhase(thought.content);
        const progressPercent = calculateProgress(thought);

        // Stuck thoughts (no activity for 7+ days)
        if (daysSinceUpdate > 7) {
          newNotifications.push({
            id: `stuck-${thought.id}`,
            type: 'stuck',
            title: 'Thought Stuck in Phase',
            message: `"${thought.content.substring(0, 50)}..." has been in ${firePhase} phase for ${daysSinceUpdate} days`,
            thoughtId: thought.id,
            firePhase,
            priority: daysSinceUpdate > 14 ? 'high' : 'medium',
            timestamp: new Date(thought.lastupdated),
            read: false,
            actionRequired: true,
            suggestedActions: generateStuckActions(firePhase),
            daysInPhase: daysSinceUpdate,
            progressPercent
          });
        }

        // Milestone notifications (progress milestones)
        if (progressPercent >= 25 && progressPercent < 50 && daysSinceUpdate < 3) {
          newNotifications.push({
            id: `milestone-${thought.id}`,
            type: 'milestone',
            title: 'Progress Milestone Reached',
            message: `Great progress on "${thought.content.substring(0, 50)}..." - ${Math.round(progressPercent)}% complete`,
            thoughtId: thought.id,
            firePhase,
            priority: 'low',
            timestamp: new Date(),
            read: false,
            actionRequired: false,
            progressPercent
          });
        }

        // Achievement notifications (completed thoughts)
        if (thought.status === 'completed' && daysSinceUpdate < 1) {
          newNotifications.push({
            id: `achievement-${thought.id}`,
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `Congratulations! You've completed "${thought.content.substring(0, 50)}..."`,
            thoughtId: thought.id,
            firePhase,
            priority: 'medium',
            timestamp: new Date(),
            read: false,
            actionRequired: false,
            progressPercent: 100
          });
        }

        // Suggestions for thoughts in early phases
        if (firePhase === 'focus' && daysSinceUpdate > 3 && daysSinceUpdate < 7) {
          newNotifications.push({
            id: `suggestion-${thought.id}`,
            type: 'suggestion',
            title: 'Ready for Next Phase?',
            message: `"${thought.content.substring(0, 50)}..." might be ready to advance to the next phase`,
            thoughtId: thought.id,
            firePhase,
            priority: 'low',
            timestamp: new Date(),
            read: false,
            actionRequired: false,
            suggestedActions: generateSuggestionActions(firePhase)
          });
        }
      });

      // Sort by priority and timestamp
      newNotifications.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Auto-dismiss notifications after a delay
  useEffect(() => {
    if (!autoDismiss) return;

    const timers: NodeJS.Timeout[] = [];
    notifications.forEach(notification => {
      if (!notification.actionRequired && notification.type !== 'stuck') {
        const timer = setTimeout(() => {
          handleDismissNotification(notification.id);
        }, 10000); // 10 seconds
        timers.push(timer);
      }
    });

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [notifications, autoDismiss]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Helper functions
  const calculateDaysSinceUpdate = (thought: Thought): number => {
    const daysSinceUpdate = (Date.now() - new Date(thought.lastupdated).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(daysSinceUpdate);
  };

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

  const calculateProgress = (thought: Thought): number => {
    // Simple progress calculation based on status and time
    switch (thought.status) {
      case 'completed': return 100;
      case 'in_progress': return 75;
      case 'concept': return 25;
      default: return 0;
    }
  };

  const generateStuckActions = (firePhase: string): string[] => {
    switch (firePhase) {
      case 'focus':
        return ['Define clear success criteria', 'Set specific timeline', 'Identify key stakeholders'];
      case 'insight':
        return ['Analyze available data', 'Conduct research', 'Document findings'];
      case 'roadmap':
        return ['Break down into steps', 'Assign responsibilities', 'Set milestones'];
      case 'execute':
        return ['Start with first action', 'Track progress daily', 'Review and adjust'];
      default:
        return ['Review and refine the approach'];
    }
  };

  const generateSuggestionActions = (firePhase: string): string[] => {
    switch (firePhase) {
      case 'focus':
        return ['Move to Insight phase', 'Gather more context', 'Refine the goal'];
      case 'insight':
        return ['Move to Roadmap phase', 'Plan next steps', 'Document learnings'];
      case 'roadmap':
        return ['Move to Execute phase', 'Start implementation', 'Set deadlines'];
      case 'execute':
        return ['Track progress', 'Measure outcomes', 'Celebrate completion'];
      default:
        return ['Review current phase'];
    }
  };

  // Handle notification actions
  const handleNotificationAction = async (notification: FireCycleNotification, action: string) => {
    if (notification.thoughtId) {
      try {
        let updates: Partial<Thought> = {};
        
        switch (action) {
          case 'advance_phase':
            const nextPhase = getNextPhase(notification.firePhase!);
            updates = {
              status: nextPhase === 'execute' ? 'in_progress' : 'concept',
              ai_clarification_data: {
                firePhase: nextPhase,
                phaseChangedAt: new Date().toISOString(),
                previousPhase: notification.firePhase,
                actionTriggered: 'notification'
              }
            };
            break;
          
          case 'mark_complete':
            updates = {
              status: 'completed',
              ai_clarification_data: {
                ...notification,
                completedAt: new Date().toISOString(),
                actionTriggered: 'notification'
              }
            };
            break;
          
          case 'update_progress':
            updates = {
              status: 'in_progress',
              ai_clarification_data: {
                progressUpdatedAt: new Date().toISOString(),
                actionTriggered: 'notification'
              }
            };
            break;
        }

        if (Object.keys(updates).length > 0) {
          await thoughtsService.updateThought({
            id: notification.thoughtId,
            content: '', // Will be preserved by service
            ...updates
          });
          
          onThoughtUpdate?.(notification.thoughtId, updates);
        }
      } catch (error) {
        console.error('Failed to update thought:', error);
      }
    }

    onNotificationAction?.(notification, action);
    handleDismissNotification(notification.id);
  };

  const getNextPhase = (currentPhase: string): 'focus' | 'insight' | 'roadmap' | 'execute' => {
    switch (currentPhase) {
      case 'focus': return 'insight';
      case 'insight': return 'roadmap';
      case 'roadmap': return 'execute';
      case 'execute': return 'focus';
      default: return 'focus';
    }
  };

  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stuck': return AlertCircle;
      case 'achievement': return CheckCircle;
      case 'milestone': return TrendingUp;
      case 'suggestion': return Sparkles;
      case 'reminder': return Clock;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'stuck': return 'border-red-200 bg-red-50';
      case 'achievement': return 'border-green-200 bg-green-50';
      case 'milestone': return 'border-blue-200 bg-blue-50';
      case 'suggestion': return 'border-yellow-200 bg-yellow-50';
      case 'reminder': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-2"></div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedNotifications = showAll ? notifications : notifications.slice(0, maxNotifications);
  const hasMore = notifications.length > maxNotifications;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">FIRE Cycle Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : 'Show all'}
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {displayedNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="group"
          >
            <Card className={`transition-all hover:shadow-md ${getNotificationColor(notification.type)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {React.createElement(getNotificationIcon(notification.type), {
                        className: 'w-4 h-4 text-primary'
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <Badge className={`text-xs ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        {notification.firePhase && (
                          <Badge variant="outline" className="text-xs">
                            {React.createElement(getPhaseIcon(notification.firePhase), {
                              className: 'w-3 h-3 mr-1'
                            })}
                            {notification.firePhase}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.daysInPhase && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.daysInPhase} days in current phase
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissNotification(notification.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Progress bar for stuck thoughts */}
                {showProgress && notification.progressPercent !== undefined && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{Math.round(notification.progressPercent)}%</span>
                    </div>
                    <Progress value={notification.progressPercent} className="h-2" />
                  </div>
                )}

                {/* Suggested actions */}
                {notification.suggestedActions && notification.suggestedActions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Suggested Actions:</p>
                    <div className="space-y-1">
                      {notification.suggestedActions.slice(0, 2).map((action, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Zap className="w-3 h-3 text-muted-foreground" />
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {notification.type === 'stuck' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleNotificationAction(notification, 'advance_phase')}
                      >
                        Advance Phase
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNotificationAction(notification, 'update_progress')}
                      >
                        Update Progress
                      </Button>
                    </>
                  )}
                  
                  {notification.type === 'suggestion' && (
                    <Button
                      size="sm"
                      onClick={() => handleNotificationAction(notification, 'advance_phase')}
                    >
                      Advance Phase
                    </Button>
                  )}
                  
                  {notification.type === 'achievement' && (
                    <Button
                      size="sm"
                      onClick={() => handleNotificationAction(notification, 'mark_complete')}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Show more/less button */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `Show ${notifications.length - maxNotifications} more`}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up! Notifications will appear here when thoughts need attention.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 