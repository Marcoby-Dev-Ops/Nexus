import React from 'react';
import { Target, Lightbulb, Map, Play, ArrowRight } from 'lucide-react';
import { useFireCyclePhase } from './FireCycleProvider';

interface FireCycleContextualProps {
  context: 'analytics' | 'projects' | 'tasks' | 'chat' | 'workspace';
  className?: string;
}

const CONTEXTUAL_ACTIONS = {
  analytics: {
    focus: {
      title: 'Set Analytics Focus',
      description: 'Define what metrics matter most right now',
      action: 'Review KPIs',
      icon: Target
    },
    insight: {
      title: 'Analytics Insights',
      description: 'What trends are you discovering?',
      action: 'Build Roadmap',
      icon: Lightbulb
    },
    roadmap: {
      title: 'Data-Driven Plan',
      description: 'How will you act on these insights?',
      action: 'Create Action Plan',
      icon: Map
    },
    execute: {
      title: 'Track Progress',
      description: 'Monitor your analytics-driven actions',
      action: 'View Progress',
      icon: Play
    }
  },
  projects: {
    focus: {
      title: 'Project Priority',
      description: 'Which project needs attention?',
      action: 'Set Priority',
      icon: Target
    },
    insight: {
      title: 'Project Insights',
      description: 'What are you learning from this project?',
      action: 'Review Learnings',
      icon: Lightbulb
    },
    roadmap: {
      title: 'Project Roadmap',
      description: 'What\'s the next milestone?',
      action: 'Plan Next Steps',
      icon: Map
    },
    execute: {
      title: 'Project Execution',
      description: 'Track project progress and deliverables',
      action: 'Update Progress',
      icon: Play
    }
  },
  tasks: {
    focus: {
      title: 'Task Focus',
      description: 'What\'s your most important task?',
      action: 'Prioritize Tasks',
      icon: Target
    },
    insight: {
      title: 'Task Patterns',
      description: 'What patterns are you noticing?',
      action: 'Analyze Patterns',
      icon: Lightbulb
    },
    roadmap: {
      title: 'Task Planning',
      description: 'How will you organize your work?',
      action: 'Create Schedule',
      icon: Map
    },
    execute: {
      title: 'Task Execution',
      description: 'Complete tasks and track productivity',
      action: 'Complete Tasks',
      icon: Play
    }
  },
  chat: {
    focus: {
      title: 'Conversation Focus',
      description: 'What\'s the main topic to discuss?',
      action: 'Set Agenda',
      icon: Target
    },
    insight: {
      title: 'Chat Insights',
      description: 'What insights emerged from this conversation?',
      action: 'Capture Insights',
      icon: Lightbulb
    },
    roadmap: {
      title: 'Action Plan',
      description: 'What actions will you take from this chat?',
      action: 'Create Actions',
      icon: Map
    },
    execute: {
      title: 'Follow Through',
      description: 'Execute on the actions from this conversation',
      action: 'Track Actions',
      icon: Play
    }
  },
  workspace: {
    focus: {
      title: 'Workspace Focus',
      description: 'What\'s your main workspace priority?',
      action: 'Set Workspace Goal',
      icon: Target
    },
    insight: {
      title: 'Workspace Insights',
      description: 'What are you learning about your workflow?',
      action: 'Optimize Workflow',
      icon: Lightbulb
    },
    roadmap: {
      title: 'Workspace Plan',
      description: 'How will you improve your workspace?',
      action: 'Plan Improvements',
      icon: Map
    },
    execute: {
      title: 'Workspace Actions',
      description: 'Implement workspace improvements',
      action: 'Apply Changes',
      icon: Play
    }
  }
};

export const FireCycleContextual: React.FC<FireCycleContextualProps> = ({
  context,
  className = ''
}) => {
  const { phase } = useFireCyclePhase();
  const contextualData = CONTEXTUAL_ACTIONS[context][phase];
  const Icon = contextualData.icon;

  const handleAction = () => {
    // This would integrate with the specific context
    console.log(`Executing ${contextualData.action} in ${context} context`);
  };

  return (
    <div className={`bg-card border rounded-lg p-4 shadow-sm ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            {contextualData.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {contextualData.description}
          </p>
          <button
            onClick={handleAction}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <span>{contextualData.action}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}; 