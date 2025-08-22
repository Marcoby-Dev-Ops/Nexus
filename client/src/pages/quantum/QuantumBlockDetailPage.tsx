import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Target, Clock, Users, TrendingUp, TrendingDown, BarChart3, CheckCircle, AlertTriangle, Brain, Zap, DollarSign, Building2, Package, BookOpen, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Progress } from '@/shared/components/ui/Progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Separator } from '@/shared/components/ui/Separator';
import { useQuantumBlock } from '@/core/api/quantum.client';
import { QUANTUM_ICONS } from '@/shared/components/layout/QuantumLayout';
import type { QuantumBlockId } from '@/core/types/quantum';

const QuantumBlockDetailPage: React.FC = () => {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const { data: blockDetail, loading, error } = useQuantumBlock(blockId as QuantumBlockId);

  // Handle error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Block</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'An error occurred while loading the block details.'}
          </p>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getBlockIcon = (blockId: string) => {
    const Icon = QUANTUM_ICONS[blockId as QuantumBlockId];
    return Icon ? <Icon className="h-6 w-6" /> : <Package className="h-6 w-6" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading quantum block details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!blockDetail) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Quantum Block Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The quantum block "{blockId}" could not be found.
          </p>
          <Button onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            {getBlockIcon(blockDetail.id)}
            <div>
              <h1 className="text-2xl font-bold">{blockDetail.title}</h1>
              <p className="text-muted-foreground">{blockDetail.description}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/quantum/blocks/${blockId}/strengthen`)}>
          Strengthen Block
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strength Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockDetail.health.strength}%</div>
            <Progress value={blockDetail.health.strength} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockDetail.health.health}%</div>
            <Progress value={blockDetail.health.health} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockDetail.metrics.currentScore}%</div>
            <div className="flex items-center mt-2">
              {blockDetail.metrics.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${blockDetail.metrics.improvement > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {blockDetail.metrics.improvement > 0 ? '+' : ''}{blockDetail.metrics.improvement}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Target Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockDetail.metrics.targetScore}%</div>
            <div className="text-sm text-muted-foreground mt-2">
              Goal for optimization
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

                 <TabsContent value="overview" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Block Overview</CardTitle>
               <CardDescription>
                 Comprehensive analysis of your {blockDetail.title.toLowerCase()} block
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                 <h4 className="font-medium mb-2">Description</h4>
                 <p className="text-muted-foreground">{blockDetail.description}</p>
               </div>
               
               <div>
                 <h4 className="font-medium mb-2">Key Properties</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {Object.entries(blockDetail.properties).map(([key, value]) => (
                     <div key={key} className="flex justify-between">
                       <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                       <span className="font-medium">{String(value)}</span>
                     </div>
                   ))}
                 </div>
               </div>
              
              <div>
                <h4 className="font-medium mb-2">Last Updated</h4>
                <p className="text-muted-foreground">
                  {new Date(blockDetail.lastUpdated).toLocaleDateString()} at{' '}
                  {new Date(blockDetail.lastUpdated).toLocaleTimeString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

                 <TabsContent value="insights" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>AI Insights</CardTitle>
               <CardDescription>
                 Intelligent analysis and observations about your {blockDetail.title.toLowerCase()} block
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {blockDetail.insights.map((insight, index) => (
                   <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                     <CheckCircle className="h-4 w-4 text-green-500" />
                     <div className="flex-1">
                       <p className="font-medium">{insight}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>

                 <TabsContent value="recommendations" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Improvement Recommendations</CardTitle>
               <CardDescription>
                 Actionable steps to strengthen your {blockDetail.title.toLowerCase()} block
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {blockDetail.recommendations.map((rec) => (
                   <div key={rec.id} className="p-4 border rounded-lg">
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                         <h4 className="font-medium">{rec.title}</h4>
                         <div className="flex items-center space-x-4 mt-3">
                           <Badge className={getPriorityColor(rec.impact)}>
                             {rec.impact} impact
                           </Badge>
                           <Badge variant="outline">
                             {rec.effort} effort
                           </Badge>
                         </div>
                       </div>
                       <Button size="sm" variant="outline">
                         Implement
                       </Button>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </TabsContent>

                 <TabsContent value="properties" className="space-y-6">
           <Card>
             <CardHeader>
               <CardTitle>Block Properties</CardTitle>
               <CardDescription>
                 Detailed configuration and relationships of your {blockDetail.title.toLowerCase()} block
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-6">
                 <div>
                   <h4 className="font-medium mb-3">Core Properties</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {Object.entries(blockDetail.properties).map(([key, value]) => (
                       <div key={key} className="p-3 border rounded-lg">
                         <div className="font-medium capitalize text-sm">
                           {key.replace(/([A-Z])/g, ' $1').trim()}
                         </div>
                         <div className="text-muted-foreground text-sm mt-1">{String(value)}</div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <Separator />
                 
                 <div>
                   <h4 className="font-medium mb-3">Relationships</h4>
                   <div className="space-y-2">
                     {blockDetail.relationships?.map((rel, index) => (
                       <div key={index} className="p-3 border rounded-lg">
                         <div className="font-medium text-sm">{rel.type}</div>
                         <div className="text-muted-foreground text-sm mt-1">Weight: {rel.weight}</div>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantumBlockDetailPage;
