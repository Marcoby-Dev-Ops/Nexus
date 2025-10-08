/**
 * Journeys Page
 * 
 * Comprehensive view of all user journeys - active, completed, paused, and available.
 * Provides filtering, searching, and management capabilities.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Map, 
  Plus, 
  Search, 
  Filter, 
  Play, 
  Pause, 
  CheckCircle, 
  Square, 
  Eye, 
  Edit, 
  Trash2,
  Clock,
  Target,
  TrendingUp,
  Users,
  Calendar,
  ArrowRight,
  RefreshCw,
  Star,
  AlertCircle,
  Zap,
  Building,
  ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/Dialog';
import { useToast } from '@/shared/ui/components/Toast';
import { useJourneyManagement } from '@/hooks/useJourneyManagement';
import { callEdgeFunction } from '@/lib/api-client';

type JourneyStatus = 'all' | 'active' | 'paused' | 'completed' | 'abandoned';
type JourneySort = 'recent' | 'progress' | 'priority' | 'name';

interface JourneyFilters {
  status: JourneyStatus;
  search: string;
  sort: JourneySort;
}

export default function JourneysPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    userJourneys,
    loadingUserJourneys,
    journeyTypes,
    loadingJourneyTypes,
    createJourney,
    pauseJourney,
    resumeJourney,
    abandonJourney,
    completeJourney
  } = useJourneyManagement();

  // Dashboard data state
  const [showPlaybooks, setShowPlaybooks] = useState<boolean>(true);

  const [filters, setFilters] = useState<JourneyFilters>({
    status: 'all',
    search: '',
    sort: 'recent'
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState<any>(null);
  const [showPlaybookDetail, setShowPlaybookDetail] = useState(false);

  // Handle playbook item click
  const handlePlaybookClick = async (playbook: any) => {
    try {
      // Fetch detailed playbook information including steps using the edge function
      const result = await callEdgeFunction('get_playbook_items', {
        playbookId: playbook.id
      });
      
      if (result.success && result.data) {
        setSelectedPlaybook({
          ...playbook,
          items: result.data
        });
      } else {
        // Fallback: show basic playbook info
        setSelectedPlaybook(playbook);
      }
      setShowPlaybookDetail(true);
    } catch (error) {
      console.error('Error fetching playbook details:', error);
      // Fallback: show basic playbook info
      setSelectedPlaybook(playbook);
      setShowPlaybookDetail(true);
    }
  };

  // Filter and sort user journeys
  const filteredUserJourneys = React.useMemo(() => {
    let filtered = userJourneys;

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(journey => journey.status === filters.status);
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(journey => 
        journey.name.toLowerCase().includes(searchLower) ||
        journey.description?.toLowerCase().includes(searchLower) ||
        journey.type?.toLowerCase().includes(searchLower)
      );
    }

    // Sort journeys
    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'recent':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'progress':
          return b.progress - a.progress;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [userJourneys, filters]);

  const handleJourneyAction = async (journeyId: string, action: 'pause' | 'resume' | 'abandon' | 'complete') => {
    try {
      let result;
      
      switch (action) {
        case 'pause':
          result = await pauseJourney(journeyId, 'User requested pause');
          break;
        case 'resume':
          result = await resumeJourney(journeyId);
          break;
        case 'abandon':
          result = await abandonJourney(journeyId, 'User abandoned journey');
          break;
        case 'complete':
          result = await completeJourney(journeyId, { 
            completionNotes: 'Journey completed by user',
            finalOutcome: 'success'
          });
          break;
      }
      
      if (result?.success) {
        toast({
          title: `Journey ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
          description: `Your journey has been ${action}d successfully.`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} journey. Please try again.`,
        type: "error"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'abandoned': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'abandoned': return <Square className="w-4 h-4" />;
      default: return <Map className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loadingUserJourneys) {
    return <JourneysPageSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Journeys</h1>
            <p className="text-muted-foreground">
              Manage your business transformation journeys
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/journey/business-identity')}
          >
            <Building className="w-4 h-4 mr-2" />
            Setup Business Identity
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Start New Journey
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search journeys..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.status}
                onValueChange={(value: JourneyStatus) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="abandoned">Abandoned</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sort}
                onValueChange={(value: JourneySort) => setFilters(prev => ({ ...prev, sort: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journey Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {userJourneys.filter(j => j.status === 'active').length}
                </p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {userJourneys.filter(j => j.status === 'paused').length}
                </p>
              </div>
              <Pause className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {userJourneys.filter(j => j.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-gray-600">
                  {userJourneys.length}
                </p>
              </div>
              <Map className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Journeys Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Your Active Journeys</h2>
            <p className="text-muted-foreground">
              Manage and track your current business transformation journeys
            </p>
          </div>
        </div>

        {filteredUserJourneys.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No journeys found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status !== 'all' 
                  ? 'No journeys match your current filters.'
                  : 'Start your first journey to begin your business transformation.'
                }
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Start New Journey
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUserJourneys.map((journey) => (
            <motion.div
              key={journey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-all cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg line-clamp-1">{journey.name}</CardTitle>
                    <Badge className={getStatusColor(journey.status)}>
                      {getStatusIcon(journey.status)}
                      {journey.status}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {journey.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{journey.progress}%</span>
                      </div>
                      <Progress value={journey.progress} className="h-2" />
                    </div>

                    {/* Journey Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span>{new Date(journey.startDate).toLocaleDateString()}</span>
                      </div>
                      {journey.targetEndDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target:</span>
                          <span>{new Date(journey.targetEndDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {journey.priority && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Priority:</span>
                          <span className={getPriorityColor(journey.priority)}>
                            {journey.priority}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/journey/${journey.id}`)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      
                      {journey.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJourneyAction(journey.id, 'pause')}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {journey.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJourneyAction(journey.id, 'resume')}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {['active', 'paused'].includes(journey.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleJourneyAction(journey.id, 'complete')}
                        >
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          </div>
        )}
      </div>

      {/* Available Journey Types Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Available Journey Types</h2>
            <p className="text-muted-foreground">
              Start new journeys from our curated collection of business transformation paths
            </p>
          </div>
        </div>

        {loadingJourneyTypes ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : journeyTypes.length > 0 ? (
          <div className="space-y-6">

            {/* Available Playbooks */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                Available Playbooks
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {journeyTypes.map((journeyType) => (
                  <motion.div
                    key={journeyType.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handlePlaybookClick(journeyType)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm text-foreground">{journeyType.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {journeyType.category}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {journeyType.complexity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{journeyType.description}</p>
                          </div>
                          <div className="text-right">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Handle start playbook action
                              }}
                            >
                              <ChevronRight className="h-3 w-3 mr-1" />
                              Start Playbook
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No journey types available</h3>
              <p className="text-muted-foreground mb-4">
                Journey types are being loaded. Please check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Playbook Detail Modal */}
      <Dialog open={showPlaybookDetail} onOpenChange={setShowPlaybookDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {selectedPlaybook?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedPlaybook?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlaybook && (
            <div className="space-y-6">
              {/* Playbook Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Playbook Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline">{selectedPlaybook.category}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Complexity:</span>
                      <Badge variant="secondary">{selectedPlaybook.complexity}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{selectedPlaybook.estimatedDuration}h</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Success Metrics</h4>
                  <div className="space-y-1">
                    {selectedPlaybook.successMetrics?.map((metric: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{metric}</span>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No success metrics defined</p>
                    )}
                  </div>
                </div>
              </div>

              {/* FIRE Philosophy Steps */}
              {selectedPlaybook.items && selectedPlaybook.items.length > 0 ? (
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    FIRE Philosophy Journey
                  </h4>
                  <div className="space-y-4">
                    {selectedPlaybook.items
                      .sort((a: any, b: any) => a.order_index - b.order_index)
                      .map((item: any, index: number) => {
                        const firePhase = item.metadata?.fire_phase || 'unknown';
                        const automationPotential = item.metadata?.automation_potential || 'unknown';
                        const keyActions = item.metadata?.key_actions || [];
                        const isMilestone = item.item_type === 'milestone';
                        const isStep = item.item_type === 'step';
                        
                        return (
                          <Card key={item.id} className={`border-l-4 ${
                            isMilestone ? 'border-l-primary bg-primary/5' : 
                            'border-l-primary/20'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {isMilestone ? (
                                      <Target className="w-4 h-4 text-primary" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                    <h5 className="font-medium text-sm">{item.name}</h5>
                                    <Badge 
                                      variant="outline" 
                                      className={`${
                                        firePhase === 'focus' ? 'bg-primary/10 text-primary border-primary/20' :
                                        firePhase === 'insight' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                        firePhase === 'roadmap' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                        firePhase === 'execute' ? 'bg-green-100 text-green-700 border-green-200' :
                                        'bg-muted'
                                      }`}
                                    >
                                      {firePhase.toUpperCase()}
                                    </Badge>
                                    <Badge 
                                      variant="secondary" 
                                      className={`${
                                        automationPotential === 'high' ? 'bg-green-100 text-green-700 border-green-200' :
                                        automationPotential === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                        'bg-gray-100 text-gray-700 border-gray-200'
                                      }`}
                                    >
                                      {automationPotential} automation
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className="bg-muted/50 text-muted-foreground border-muted"
                                    >
                                      {item.item_type === 'milestone' ? 'Milestone' : 'Action Step'}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                                  
                                  {keyActions.length > 0 && (
                                    <div className="mt-2">
                                      <h6 className="text-xs font-medium text-muted-foreground mb-1">Key Actions:</h6>
                                      <div className="flex flex-wrap gap-1">
                                        {keyActions.map((action: string, actionIndex: number) => (
                                          <Badge key={actionIndex} variant="outline" className="bg-muted/30 text-muted-foreground border-muted">
                                            {action}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                  <div>{item.estimated_duration_minutes}min</div>
                                  <div className="flex items-center gap-1 mt-1">
                                    {item.is_required ? (
                                      <Badge variant="destructive">Required</Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-muted">Optional</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No Steps Available</h4>
                  <p className="text-sm text-muted-foreground">
                    This playbook needs to be enhanced with FIRE philosophy steps.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPlaybookDetail(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  // Handle start playbook action
                  setShowPlaybookDetail(false);
                }}>
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Start This Playbook
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading skeleton component
function JourneysPageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
