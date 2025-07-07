import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, Clock } from 'lucide-react';

// Local starter config for demonstration
export type QuickActionType = 'global' | 'department' | 'page';
export type HandlerType = 'crud_create' | 'crud_read' | 'crud_update' | 'crud_delete' | 'ai_chat' | 'rag' | 'custom';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  type: QuickActionType;
  handlerType: HandlerType;
  entity?: string;
  department?: string;
  page?: string;
  permission?: string;
  description?: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'review-deals',
    label: 'Review High-Value Deals',
    icon: '💰',
    type: 'global',
    handlerType: 'custom',
    permission: 'all',
    description: 'Review 3 deals worth $180K in negotiation stage',
  },
  {
    id: 'support-tickets',
    label: 'Handle Support Escalations',
    icon: '🎧',
    type: 'global',
    handlerType: 'custom',
    permission: 'all',
    description: 'Review 5 escalated support tickets',
  },
  {
    id: 'schedule-meetings',
    label: 'Schedule Q4 Planning',
    icon: '📅',
    type: 'global',
    handlerType: 'custom',
    permission: 'all',
    description: 'Set up Q4 planning sessions with department heads',
  },
  {
    id: 'upsell-customers',
    label: 'Contact Upsell Prospects',
    icon: '📈',
    type: 'global',
    handlerType: 'custom',
    permission: 'all',
    description: 'Reach out to 8 customers ready for premium features',
  },
  {
    id: 'automate-invoices',
    label: 'Set Up Invoice Automation',
    icon: '⚡',
    type: 'global',
    handlerType: 'custom',
    permission: 'all',
    description: 'Configure automated invoice processing',
  },
  {
    id: 'team-recognition',
    label: 'Recognize Team Success',
    icon: '🏆',
    type: 'global',
    handlerType: 'custom',
    permission: 'all',
    description: 'Plan team recognition for exceeding targets',
  },
];

// Placeholder user and context
const user = { permissions: ['all'], department: 'Sales' };
const department = 'Sales';
const page = 'Dashboard';

function handleQuickAction(action: QuickAction, { navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  switch (action.id) {
    case 'review-deals':
      navigate('/sales');
      break;
    case 'support-tickets':
      navigate('/support');
      break;
    case 'schedule-meetings':
      navigate('/workspace'); // Calendar widget for scheduling
      break;
    case 'upsell-customers':
      navigate('/sales');
      break;
    case 'automate-invoices':
      navigate('/operations');
      break;
    case 'team-recognition':
      navigate('/hr');
      break;
    default:
      alert(`Action: ${action.label}`);
  }
}

export const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();

  // Filter actions by user, department, and page
  const availableActions = quickActions.filter((action: QuickAction) => {
    if (action.permission && action.permission !== "all" && !user?.permissions?.includes(action.permission)) {
      return false;
    }
    if (action.type === "department" && action.department && action.department !== department) {
      return false;
    }
    if (action.type === "page" && action.page && action.page !== page) {
      return false;
    }
    return true;
  });

  if (availableActions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No priority actions available right now.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <CardTitle>Priority Actions</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {availableActions.length} tasks
          </Badge>
        </div>
        <CardDescription>
          Take action on these high-impact business opportunities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {availableActions.map((action: QuickAction) => (
            <button
              key={action.id}
              className="w-full flex items-start gap-4 p-4 bg-muted/50 border border-border rounded-lg hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-200 text-left group"
              aria-label={action.label}
              onClick={() => handleQuickAction(action, { navigate })}
            >
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-200">
                <span className="text-lg" aria-hidden="true">{action.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                  {action.label}
                </h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {action.description}
                </p>
              </div>
              <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                →
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}; 