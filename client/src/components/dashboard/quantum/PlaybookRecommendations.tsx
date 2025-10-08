import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Target, ArrowRight } from 'lucide-react';

interface PlaybookRecommendation {
  playbook: {
    id: string;
    title: string;
    description: string;
  };
  priority: string;
  estimatedImpact: string;
}

interface PlaybookRecommendationsProps {
  playbookRecommendations: PlaybookRecommendation[];
}

export function PlaybookRecommendations({ playbookRecommendations }: PlaybookRecommendationsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recommended Playbooks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {playbookRecommendations.length > 0 ? (
            playbookRecommendations.map((rec) => (
              <motion.div
                key={rec.playbook.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{rec.playbook.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{rec.playbook.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                        {rec.priority} priority
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {rec.estimatedImpact} impact
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No playbook recommendations available
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
