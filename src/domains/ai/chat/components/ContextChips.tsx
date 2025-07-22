import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, FileText, User, TrendingUp, Building, Globe, Brain, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/shared/components/ui/Dialog';
// ScrollArea component not available, using div with overflow

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
      return 'bg-primary/5 text-primary border-border';
    case 'business_data':
      return 'bg-success/5 text-success border-green-200';
    case 'cloud_document':
      return 'bg-secondary/5 text-purple-700 border-purple-200';
    case 'department_metrics':
      return 'bg-orange-50 text-warning border-orange-200';
    case 'integration':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'conversation_history':
      return 'bg-background text-foreground/90 border-border';
    default:
      return 'bg-background text-foreground/90 border-border';
  }
};

const ContextChip: React.FC<{ source: ContextSource; compact?: boolean }> = ({ source, compact }) => {
  const colorClass = getSourceColor(source.type);
  const icon = getSourceIcon(source.type);
  
  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} ${compact ? 'text-xs px-2 py-1' : 'px-4 py-2'} font-medium inline-flex items-center gap-1.5`}
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
        <div className="space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Confidence</div>
              <div className="flex items-center gap-1">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
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
              <div className="text-sm bg-background p-4 rounded-lg">
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
  
  if (!sources || sources.length === 0) {
    return null;
  }

  // Sort sources by confidence (highest first)
  const sortedSources = [...sources].sort((a, b) => b.confidence - a.confidence);
  
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Context chips */}
      {sortedSources.slice(0, compact ? 2 : 4).map((source) => (
        <ContextChip key={source.id} source={source} compact={compact} />
      ))}
      
      {/* Show more chips if there are additional sources */}
      {sortedSources.length > (compact ? 2 : 4) && (
        <Badge variant="outline" className="text-xs px-2 py-1 text-muted-foreground">
          +{sortedSources.length - (compact ? 2 : 4)} more
        </Badge>
      )}
      
      {/* Explain Source dialog */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <span>Explain sources</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Response Sources ({sortedSources.length})
            </DialogTitle>
            <DialogDescription>
              This response was generated using the following information sources:
            </DialogDescription>
          </DialogHeader>
                  <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
          {sortedSources.map((source) => (
            <SourceDetailCard key={source.id} source={source} />
          ))}
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContextChips; 