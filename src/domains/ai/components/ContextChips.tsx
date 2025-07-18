import React, { useState } from 'react';
import { Database, FileText, User, TrendingUp, Globe, Brain, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/Dialog';
import { useUserContext } from '../hooks/useUserContext';

export interface ContextSource {
  id: string;
  type: 'user_profile' | 'business_data' | 'cloud_document' | 'department_metrics' | 'integration' | 'conversation_history';
  title: string;
  description: string;
  confidence: number;
  metadata: {
    lastUpdated?: string;
    source?: string;
    relevance?: number;
    dataPoints?: number;
    [key: string]: any;
  };
  content?: string;
  icon?: React.ReactNode;
}

interface ContextChipsProps {
  sources: ContextSource[];
  className?: string;
  compact?: boolean;
}

const getSourceIcon = (type: ContextSource['type']) => {
  switch (type) {
    case 'user_profile':
      return <User className="w-3 h-3" />;
    case 'business_data':
      return <TrendingUp className="w-3 h-3" />;
    case 'cloud_document':
      return <FileText className="w-3 h-3" />;
    case 'department_metrics':
      return <Database className="w-3 h-3" />;
    case 'integration':
      return <Globe className="w-3 h-3" />;
    case 'conversation_history':
      return <Brain className="w-3 h-3" />;
    default:
      return <AlertCircle className="w-3 h-3" />;
  }
};

const getSourceColor = (type: ContextSource['type']) => {
  switch (type) {
    case 'user_profile':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'business_data':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'cloud_document':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'department_metrics':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'integration':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'conversation_history':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const ContextChip: React.FC<{ source: ContextSource; compact?: boolean }> = ({ source, compact }) => {
  const colorClass = getSourceColor(source.type);
  const icon = getSourceIcon(source.type);
  
  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} ${compact ? 'text-xs px-2 py-1' : 'px-3 py-1.5'} font-medium inline-flex items-center gap-1.5`}
    >
      {icon}
      <span>{source.title}</span>
      {source.confidence > 0 && (
        <span className="text-xs opacity-75">
          {Math.round(source.confidence * 100)}%
        </span>
      )}
    </Badge>
  );
};

const SourceDetailCard: React.FC<{ source: ContextSource }> = ({ source }) => {
  const colorClass = getSourceColor(source.type);
  const icon = getSourceIcon(source.type);
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <div>
            <div className="font-semibold">{source.title}</div>
            <div className="text-sm text-muted-foreground font-normal">{source.description}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Confidence</div>
              <div className="flex items-center gap-1">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${source.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs">{Math.round(source.confidence * 100)}%</span>
              </div>
            </div>
            {source.metadata.relevance && (
              <div>
                <div className="font-medium text-muted-foreground">Relevance</div>
                <div className="flex items-center gap-1">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${source.metadata.relevance * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{Math.round(source.metadata.relevance * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Additional metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {source.metadata.lastUpdated && (
              <div>
                <div className="font-medium text-muted-foreground">Last Updated</div>
                <div>{new Date(source.metadata.lastUpdated).toLocaleDateString()}</div>
              </div>
            )}
            {source.metadata.source && (
              <div>
                <div className="font-medium text-muted-foreground">Source</div>
                <div>{source.metadata.source}</div>
              </div>
            )}
            {source.metadata.dataPoints && (
              <div>
                <div className="font-medium text-muted-foreground">Data Points</div>
                <div>{source.metadata.dataPoints}</div>
              </div>
            )}
          </div>

          {/* Content preview */}
          {source.content && (
            <div>
              <div className="font-medium text-muted-foreground mb-2">Content Preview</div>
              <div className="text-sm bg-gray-50 p-3 rounded-lg">
                <p className="overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                  {source.content}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ContextChips: React.FC<ContextChipsProps> = ({ sources, className = '', compact = false }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { context: userContext, updateActivity } = useUserContext();
  
  // Track context chip interaction
  React.useEffect(() => {
    if (sources.length > 0) {
      updateActivity('viewed_context_chips', {
        count: sources.length,
        types: sources.map(s => s.type)
      });
    }
  }, [sources, updateActivity]);
  
  // Sort sources by confidence (highest first)
  const sortedSources = [...sources].sort((a, b) => b.confidence - a.confidence);
  
  // Add user context sources if available
  const enhancedSources = React.useMemo(() => {
    const enhanced = [...sortedSources];
    
    if (userContext) {
      // Add user profile context
      enhanced.unshift({
        id: 'user-profile',
        type: 'user_profile' as const,
        title: `${userContext.userRole} Context`,
        description: `Role: ${userContext.userRole}, Department: ${userContext.userDepartment}`,
        confidence: 1.0,
        metadata: {
          lastUpdated: new Date().toISOString(),
          source: 'User Profile',
          relevance: 0.95,
          dataPoints: 1
        },
        content: `User: ${userContext.userRole} in ${userContext.userDepartment} department. Company: ${userContext.businessContext.companyName || 'Unknown'}.`
      });
      
      // Add business context
      if (userContext.businessContext.teamMembers.length > 0) {
        enhanced.unshift({
          id: 'business-context',
          type: 'business_data' as const,
          title: 'Business Context',
          description: `${userContext.businessContext.teamMembers.length} team members, ${userContext.businessContext.companyName || 'Company'}`,
          confidence: 0.9,
          metadata: {
            lastUpdated: new Date().toISOString(),
            source: 'Business Data',
            relevance: 0.85,
            dataPoints: userContext.businessContext.teamMembers.length
          },
          content: `Company: ${userContext.businessContext.companyName || 'Unknown'}. Team size: ${userContext.businessContext.teamMembers.length} members.`
        });
      }
    }
    
    return enhanced;
  }, [sortedSources, userContext]);
  
  if (!sources || sources.length === 0) {
    return null;
  }
  
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Context chips */}
      {enhancedSources.slice(0, compact ? 2 : 4).map((source) => (
        <ContextChip key={source.id} source={source} compact={compact} />
      ))}
      
      {/* Show more chips if there are additional sources */}
      {enhancedSources.length > (compact ? 2 : 4) && (
        <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DialogTrigger asChild>
            <Badge variant="outline" className="text-xs px-2 py-1 text-muted-foreground cursor-pointer hover:bg-gray-50">
              +{enhancedSources.length - (compact ? 2 : 4)} more
            </Badge>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>All Context Sources</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {enhancedSources.map((source) => (
                <SourceDetailCard key={source.id} source={source} />
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}; 