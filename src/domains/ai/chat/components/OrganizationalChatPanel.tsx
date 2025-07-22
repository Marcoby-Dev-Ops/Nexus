/**
 * OrganizationalChatPanel.tsx
 * 
 * AI chat interface that defaults to Executive Assistant
 * with intelligent routing to department assistants when needed
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  ArrowLeft,
  MessageSquare,
  Building2,
  Users
} from 'lucide-react';
import { 
  executiveAgent,
  departmentalAgents,
  type Agent 
} from '@/domains/ai/lib/agentRegistry';
import { ModernExecutiveAssistant } from '@/domains/ai/agents';
import { DepartmentalAgent } from '@/domains/ai/agents';
import { useAuthContext } from '@/domains/admin/user/hooks/AuthContext';

/**
 * @interface OrganizationalChatPanelProps
 */
interface OrganizationalChatPanelProps {
  onClose?: () => void;
}

/**
 * @interface DepartmentSelectorProps
 */
interface DepartmentSelectorProps {
  onDepartmentSelect: (agent: Agent) => void;
  onBackToExecutive: () => void;
}

/**
 * Department Selection Component
 */
const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({ onDepartmentSelect, onBackToExecutive }) => {
  const getDepartmentIcon = (department: string): string => {
    const icons: Record<string, string> = {
      sales: '📈',
      marketing: '🎯', 
      finance: '💰',
      operations: '⚙️'
    };
    return icons[department] || '🏢';
  };

  const getDepartmentColor = (department: string): string => {
    const colors: Record<string, string> = {
      sales: 'from-green-600 to-green-700',
      marketing: 'from-purple-600 to-purple-700',
      finance: 'from-blue-600 to-blue-700',
      operations: 'from-orange-600 to-orange-700'
    };
    return colors[department] || 'from-gray-600 to-gray-700';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button
          onClick={onBackToExecutive}
          className="p-4 rounded-lg hover:bg-muted transition-colors"
          aria-label="Back to Executive Assistant"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Department Specialists</h2>
          <p className="text-xs text-muted-foreground">Choose a department for specialized assistance</p>
        </div>
      </div>

      {/* Department Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
          {departmentalAgents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onDepartmentSelect(agent)}
              className="group p-6 rounded-xl border border-border hover:border-border/80 bg-card hover:bg-card/80 transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-4">
                {/* Department Icon */}
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getDepartmentColor(agent.department || '')} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <span className="text-xl">{agent.avatar}</span>
                </div>
                
                {/* Department Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {agent.name}
                    </h3>
                    <span className="text-xl">{getDepartmentIcon(agent.department || '')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description}
                  </p>
                  
                  {/* Specialties */}
                  {agent.specialties && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agent.specialties.slice(0, 3).map((specialty, index) => (
                        <span
                          key={index}
                          className="px-4 py-4 bg-muted text-muted-foreground text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                      {agent.specialties.length > 3 && (
                        <span className="px-4 py-4 bg-muted text-muted-foreground text-xs rounded-full">
                          +{agent.specialties.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Help Text */}
        <div className="text-center p-4 bg-muted/30 rounded-lg mt-6 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Department assistants have specialized knowledge and can route to expert sub-assistants
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Organizational Chat Panel Component
 */
export const OrganizationalChatPanel: React.FC<OrganizationalChatPanelProps> = ({ onClose }) => {
  const [currentView, setCurrentView] = useState<'executive' | 'departments' | 'department-chat'>('executive');
  const [selectedDepartment, setSelectedDepartment] = useState<Agent | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const { user } = useAuthContext();

  // Initialize session ID for comprehensive tracking
  useEffect(() => {
    (async () => {
      if (user?.id) {
        try {
          const { chatHistory } = await import('@/domains/admin/onboarding/services/chatHistoryService');
          const { executiveAgent } = await import('@/domains/ai/lib/agentRegistry');
          const conv = await chatHistory.createConversation({
            user_id: user.id,
            title: 'Organizational Chat',
            context: { source: 'org-chat', agent_id: executiveAgent.id }
          });
          setSessionId(conv.id);
        } catch (err) {
          console.error('Failed to create organizational conversation', err);
        }
      }
    })();
  }, [user?.id]);

  const handleShowDepartments = () => {
    setCurrentView('departments');
  };

  const handleDepartmentSelect = (agent: Agent) => {
    setSelectedDepartment(agent);
    setCurrentView('department-chat');
  };

  const handleBackToExecutive = () => {
    setCurrentView('executive');
    setSelectedDepartment(null);
  };

  const handleBackToDepartments = () => {
    setCurrentView('departments');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {currentView === 'executive' && (
        <>
          {/* Executive Assistant Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="text-lg">{executiveAgent.avatar}</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{executiveAgent.name}</h2>
                  <p className="text-xs text-muted-foreground">Your central AI coordinator</p>
                </div>
              </div>
              
              {/* Department Access Button */}
              <button
                onClick={handleShowDepartments}
                className="flex items-center gap-2 px-4 py-4 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Departments</span>
              </button>
            </div>
          </div>

                               {/* Executive Assistant Chat */}
          <div className="flex-1">
            <ModernExecutiveAssistant onClose={onClose || (() => {})} sessionId={sessionId} />
          </div>
        </>
      )}

      {currentView === 'departments' && (
        <DepartmentSelector 
          onDepartmentSelect={handleDepartmentSelect}
          onBackToExecutive={handleBackToExecutive}
        />
      )}

      {currentView === 'department-chat' && selectedDepartment && (
        <DepartmentalAgent 
          agent={selectedDepartment} 
          onBack={handleBackToDepartments}
          onClose={onClose}
        />
      )}
    </div>
  );
};

OrganizationalChatPanel.propTypes = {
  onClose: PropTypes.func,
};

export default OrganizationalChatPanel; 