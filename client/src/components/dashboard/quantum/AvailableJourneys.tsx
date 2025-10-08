import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Rocket, Play } from 'lucide-react';

interface Journey {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: string;
}

interface AvailableJourneysProps {
  journeys?: Journey[];
}

export function AvailableJourneys({ journeys = [] }: AvailableJourneysProps) {
  const defaultJourneys: Journey[] = [
    {
      id: '1',
      title: 'Business Identity Setup',
      description: 'Define your mission, vision, and values',
      estimatedTime: '30 min',
      difficulty: 'Beginner'
    },
    {
      id: '2',
      title: 'Revenue Optimization',
      description: 'Improve your sales and pricing strategy',
      estimatedTime: '45 min',
      difficulty: 'Intermediate'
    },
    {
      id: '3',
      title: 'Team Building',
      description: 'Build and scale your team effectively',
      estimatedTime: '60 min',
      difficulty: 'Advanced'
    }
  ];

  const availableJourneys = journeys.length > 0 ? journeys : defaultJourneys;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Available Journeys
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availableJourneys.map((journey, index) => (
            <motion.div
              key={journey.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{journey.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{journey.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{journey.estimatedTime}</span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">{journey.difficulty}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
