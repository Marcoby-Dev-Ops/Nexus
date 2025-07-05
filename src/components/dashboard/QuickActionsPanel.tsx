import React from "react";
import { useNavigate } from "react-router-dom";

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
    id: 'ai-chat',
    label: 'Chat with AI',
    icon: '💬',
    type: 'global',
    handlerType: 'ai_chat',
    permission: 'all',
    description: 'Ask the AI assistant anything or use RAG features.',
  },
  {
    id: 'view-exec-notes',
    label: 'View Executive Notes',
    icon: '📝',
    type: 'global',
    handlerType: 'crud_read',
    entity: 'Note',
    permission: 'all',
    description: 'View notes from your executive assistant.',
  },
];

// Placeholder user and context
const user = { permissions: ['all'], department: 'Sales' };
const department = 'Sales';
const page = 'Dashboard';

function handleQuickAction(action: QuickAction, { navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  if (action.handlerType === 'ai_chat') {
    navigate('/ai-chat');
  } else if (action.handlerType === 'crud_read' && action.entity === 'Note') {
    navigate('/notes');
  } else {
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
      <div className="p-4 text-center text-gray-500">No quick actions available for your current context.</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg shadow">
      {availableActions.map((action: QuickAction) => (
        <button
          key={action.id}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label={action.label}
          onClick={() => handleQuickAction(action, { navigate })}
        >
          <span aria-hidden="true">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}; 