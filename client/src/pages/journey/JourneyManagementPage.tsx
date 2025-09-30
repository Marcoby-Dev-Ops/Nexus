/**
 * Journey Management Page
 * 
 * Demonstrates the unified journey chat framework for journey selection,
 * updating, and completion in Nexus.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { useToast } from '@/shared/ui/components/Toast';
import { useJourneyManagement } from '@/hooks/useJourneyManagement';
import UnifiedJourneyChat from '@/components/journey/UnifiedJourneyChat';
import { 
  Map, 
  RefreshCw, 
  CheckCircle, 
  Plus,
  Play,
  Pause,
  Square,
  ArrowLeft
} from 'lucide-react';

type JourneyMode = 'select' | 'update' | 'complete';

export default function JourneyManagementPage() {
  const [activeMode, setActiveMode] = useState<JourneyMode>('select');
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  
  const {
    userJourneys,
    loadingUserJourneys,
    currentJourney,
    loadingCurrentJourney,
    getJourney,
    createJourney,
    updateJourney,
    completeJourney,
    pauseJourney,
    resumeJourney,
    abandonJourney
  } = useJourneyManagement();

  const handleJourneySelected = (journey: any) => {
    toast({
      title: "Journey Created!",
      description: `Your ${journey.name} journey has been created successfully.`,
      type: "success"
    });
    setShowChat(false);
    // Refresh the journeys list
    window.location.reload();
  };

  const handleJourneyUpdated = (journey: any) => {
    toast({
      title: "Journey Updated!",
      description: "Your journey has been updated successfully.",
      type: "success"
    });
    setShowChat(false);
    // Refresh the current journey
    if (journey.id) {
      getJourney(journey.id);
    }
  };

  const handleJourneyCompleted = (journey: any) => {
    toast({
      title: "Journey Completed!",
      description: "Congratulations! Your journey has been completed successfully.",
      type: "success"
    });
    setShowChat(false);
    // Refresh the current journey
    if (journey.id) {
      getJourney(journey.id);
    }
  };

  const handleJourneyAction = async (journeyId: string, action: 'pause' | 'resume' | 'abandon') => {
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
      }
      
      if (result?.success) {
        toast({
          title: `Journey ${action.charAt(0).toUpperCase() + action.slice(1)}d`,
          description: `Your journey has been ${action}d successfully.`,
          type: "success"
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'abandoned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (showChat) {
    return (
      <div className="h-screen">
        <UnifiedJourneyChat
          mode={activeMode}
          existingJourneyId={selectedJourneyId || undefined}
          onJourneySelected={handleJourneySelected}
          onJourneyUpdated={handleJourneyUpdated}
          onJourneyCompleted={handleJourneyCompleted}
          onBack={() => setShowChat(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Journey Management</h1>
            <p className="text-muted-foreground">
              Select, update, and complete your business journeys
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-3">
        <Button 
          onClick={() => {
            setActiveMode('select');
            setSelectedJourneyId(null);
            setShowChat(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Start New Journey
        </Button>
        
        {currentJourney && (
          <>
            <Button 
              onClick={() => {
                setActiveMode('update');
                setSelectedJourneyId(currentJourney.id);
                setShowChat(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Update Journey
            </Button>
            
            <Button 
              onClick={() => {
                setActiveMode('complete');
                setSelectedJourneyId(currentJourney.id);
                setShowChat(true);
              }}
              variant="outline"
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Complete Journey
            </Button>
          </>
        )}
      </div>

      {/* Current Journey */}
      {currentJourney && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Journey</span>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(currentJourney.status)}>
                  {getStatusIcon(currentJourney.status)}
                  {currentJourney.status}
                </Badge>
                <Badge variant="secondary">
                  {currentJourney.progress}% complete
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">{currentJourney.name}</h3>
                <p className="text-muted-foreground mb-4">{currentJourney.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Started:</span>
                    <span>{new Date(currentJourney.startDate).toLocaleDateString()}</span>
                  </div>
                  {currentJourney.targetEndDate && (
                    <div className="flex justify-between text-sm">
                      <span>Target End:</span>
                      <span>{new Date(currentJourney.targetEndDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Milestones:</span>
                    <span>{currentJourney.completedMilestones.length} / {currentJourney.customMilestones.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <h4 className="font-medium">Goals:</h4>
                <ul className="space-y-1">
                  {currentJourney.goals.map((goal, index) => (
                    <li key={index} className="text-sm text-muted-foreground">• {goal}</li>
                  ))}
                </ul>
                
                <div className="flex gap-2 mt-4">
                  {currentJourney.status === 'active' && (
                    <Button 
                      onClick={() => handleJourneyAction(currentJourney.id, 'pause')}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </Button>
                  )}
                  
                  {currentJourney.status === 'paused' && (
                    <Button 
                      onClick={() => handleJourneyAction(currentJourney.id, 'resume')}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Play className="w-3 h-3" />
                      Resume
                    </Button>
                  )}
                  
                  {['active', 'paused'].includes(currentJourney.status) && (
                    <Button 
                      onClick={() => handleJourneyAction(currentJourney.id, 'abandon')}
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                    >
                      <Square className="w-3 h-3" />
                      Abandon
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Journeys */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Journeys</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <JourneyList 
            journeys={userJourneys}
            loading={loadingUserJourneys}
            onJourneySelect={(journey) => {
              getJourney(journey.id);
            }}
          />
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <JourneyList 
            journeys={userJourneys.filter(j => j.status === 'active')}
            loading={loadingUserJourneys}
            onJourneySelect={(journey) => {
              getJourney(journey.id);
            }}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <JourneyList 
            journeys={userJourneys.filter(j => j.status === 'completed')}
            loading={loadingUserJourneys}
            onJourneySelect={(journey) => {
              getJourney(journey.id);
            }}
          />
        </TabsContent>
        
        <TabsContent value="paused" className="mt-6">
          <JourneyList 
            journeys={userJourneys.filter(j => j.status === 'paused')}
            loading={loadingUserJourneys}
            onJourneySelect={(journey) => {
              getJourney(journey.id);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface JourneyListProps {
  journeys: any[];
  loading: boolean;
  onJourneySelect: (journey: any) => void;
}

function JourneyList({ journeys, loading, onJourneySelect }: JourneyListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading journeys...</p>
        </div>
      </div>
    );
  }

  if (journeys.length === 0) {
    return (
      <div className="text-center py-12">
        <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No journeys found</h3>
        <p className="text-muted-foreground mb-4">
          Start your first journey to begin your business transformation
        </p>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Start New Journey
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {journeys.map((journey) => (
        <Card 
          key={journey.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onJourneySelect(journey)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{journey.name}</CardTitle>
              <Badge className={getStatusColor(journey.status)}>
                {getStatusIcon(journey.status)}
                {journey.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 line-clamp-2">
              {journey.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress:</span>
                <span>{journey.progress}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Started:</span>
                <span>{new Date(journey.startDate).toLocaleDateString()}</span>
              </div>
              {journey.targetEndDate && (
                <div className="flex justify-between text-sm">
                  <span>Target:</span>
                  <span>{new Date(journey.targetEndDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'paused': return 'bg-yellow-100 text-yellow-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'abandoned': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <Play className="w-4 h-4" />;
    case 'paused': return <Pause className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'abandoned': return <Square className="w-4 h-4" />;
    default: return <Map className="w-4 h-4" />;
  }
}
