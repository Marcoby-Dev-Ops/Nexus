import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { BookOpen, AlertCircle, ExternalLink, FileText, Video, GraduationCap, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { learningFeedService } from '@/lib/services/learningFeedService';
import type { LearningMaterial } from '@/lib/services/learningFeedService';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

const typeIcons = {
    article: <FileText className="h-5 w-5 text-primary" />,
    video: <Video className="h-5 w-5 text-destructive" />,
    course: <GraduationCap className="h-5 w-5 text-success" />,
    playbook: <Zap className="h-5 w-5 text-secondary" />,
}

export const LearningFeedWidget: React.FC = () => {
  const { data: learningMaterials, isLoading, isError } = useQuery({
    queryKey: ['learningMaterials'],
    queryFn: () => learningFeedService.getLearningMaterials(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <span>Learning Feed</span>
        </CardTitle>
        <CardDescription>Contextual tips and improvement suggestions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          )}

          {isError && (
            <div className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading learning materials.</p>
            </div>
          )}

          {learningMaterials && learningMaterials.map((material: LearningMaterial) => (
            <a
              key={material.id}
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                    {typeIcons[material.type] || <BookOpen className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">{material.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{material.summary}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-2">
                        {material.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                     <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>Read more</span>
                        <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </div>
            </a>
          ))}

          {!isLoading && !isError && learningMaterials?.length === 0 && (
            <p className="text-sm text-muted-foreground">No learning materials available at the moment.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 