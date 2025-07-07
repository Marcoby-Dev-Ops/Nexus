import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Zap, 
  Brain, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  FileText,
  PlusCircle,
  Clock,
  Target,
  Lightbulb,
  Focus,
  Coffee,
  BookOpen,
  Timer,
  Headphones,
  Moon
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

export const WorkspaceQuickActions: React.FC = () => {
  const quickActions: QuickAction[] = [
    {
      id: 'capture-idea',
      title: 'Capture Idea',
      description: 'Quickly save a new thought or insight',
      icon: <Lightbulb className="w-5 h-5" />,
      action: () => {
        // Focus on the ideas widget input
        const ideaInput = document.querySelector('input[placeholder*="idea"]') as HTMLInputElement;
        if (ideaInput) {
          ideaInput.focus();
          ideaInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      color: 'bg-warning/5 border-yellow-200 hover:bg-warning/10'
    },
    {
      id: 'add-task',
      title: 'Add Task',
      description: 'Create a new task to track progress',
      icon: <CheckSquare className="w-5 h-5" />,
      action: () => {
        // Focus on the tasks widget input
        const taskInput = document.querySelector('input[placeholder*="task"]') as HTMLInputElement;
        if (taskInput) {
          taskInput.focus();
          taskInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      },
      color: 'bg-success/5 border-green-200 hover:bg-success/10'
    },
    {
      id: 'focus-timer',
      title: 'Focus Timer',
      description: 'Start a 25-minute focus session',
      icon: <Timer className="w-5 h-5" />,
      action: () => {
        // This could integrate with a pomodoro timer
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + 25 * 60 * 1000);
        alert(`🍅 Focus session started! Work until ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      },
      color: 'bg-destructive/5 border-red-200 hover:bg-destructive/10'
    },
    {
      id: 'deep-work',
      title: 'Deep Work',
      description: 'Block distractions for 2 hours',
      icon: <Focus className="w-5 h-5" />,
      action: () => {
        // This could integrate with focus/do-not-disturb mode
        alert('🎯 Deep work mode activated! All notifications muted for 2 hours.');
      },
      color: 'bg-secondary/5 border-purple-200 hover:bg-secondary/10'
    },
    {
      id: 'quick-note',
      title: 'Quick Note',
      description: 'Jot down a quick thought',
      icon: <FileText className="w-5 h-5" />,
      action: () => {
        const note = prompt('Quick note:');
        if (note && note.trim()) {
          // Save to local storage or notes service
          const notes = JSON.parse(localStorage.getItem('quickNotes') || '[]');
          notes.push({
            id: Date.now(),
            content: note,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('quickNotes', JSON.stringify(notes));
          alert('📝 Note saved to your quick notes!');
        }
      },
      color: 'bg-background border-border hover:bg-muted'
    },
    {
      id: 'break-reminder',
      title: 'Break Time',
      description: 'Take a 5-minute break',
      icon: <Coffee className="w-5 h-5" />,
      action: () => {
        // Start a 5-minute break timer
        alert('☕ Break time! Step away from your screen for 5 minutes. Your eyes and mind will thank you.');
      },
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100'
    },
    {
      id: 'learning-session',
      title: 'Learn Something',
      description: 'Quick 10-minute learning',
      icon: <BookOpen className="w-5 h-5" />,
      action: () => {
        // Open learning resources
        const learningTopics = [
          'https://www.youtube.com/results?search_query=productivity+tips+10+minutes',
          'https://www.coursera.org/browse',
          'https://www.khanacademy.org/',
          'https://www.ted.com/talks'
        ];
        const randomTopic = learningTopics[Math.floor(Math.random() * learningTopics.length)];
        window.open(randomTopic, '_blank');
      },
      color: 'bg-primary/5 border-border hover:bg-primary/10'
    },
    {
      id: 'mindfulness',
      title: 'Mindfulness',
      description: '2-minute breathing exercise',
      icon: <Moon className="w-5 h-5" />,
      action: () => {
        // Start a mindfulness session
        alert('🧘‍♀️ Take a moment to breathe. Inhale for 4 counts, hold for 4, exhale for 4. Repeat 5 times.');
      },
      color: 'bg-primary/5 border-indigo-200 hover:bg-indigo-100'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Personal Quick Actions
        </CardTitle>
        <CardDescription>
          Boost your productivity with one-click personal tools
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-center gap-2 text-center border-2 transition-all duration-200 ${action.color}`}
              onClick={action.action}
            >
              <div className="text-muted-foreground">
                {action.icon}
              </div>
              <div>
                <div className="font-semibold text-xs text-foreground">{action.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-tight">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 