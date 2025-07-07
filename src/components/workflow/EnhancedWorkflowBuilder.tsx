import React, { useState, useCallback } from 'react';
import { Play, CheckCircle, AlertCircle, Workflow } from 'lucide-react';
import { n8nWorkflowBuilder } from '../../lib/n8nWorkflowBuilder';
import { Spinner } from '../ui/Spinner';

interface EnhancedWorkflowBuilderProps {
  initialDescription?: string;
  department?: string;
  onWorkflowCreated?: (workflowId: string, webhookUrl?: string) => void;
  onClose?: () => void;
  className?: string;
}

export const EnhancedWorkflowBuilder: React.FC<EnhancedWorkflowBuilderProps> = ({
  initialDescription = '',
  department = 'general',
  onWorkflowCreated,
  onClose,
  className = ''
}) => {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState(initialDescription);
  const [triggerType, setTriggerType] = useState<'webhook' | 'schedule' | 'manual' | 'email'>('webhook');
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const availableIntegrations = [
    'hubspot', 'salesforce', 'stripe', 'slack', 'gmail', 'supabase', 'openai'
  ];

  const generateWorkflow = useCallback(async () => {
    if (!workflowName.trim() || !workflowDescription.trim()) {
      setError('Please provide both workflow name and description');
      return;
    }

    setIsBuilding(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await n8nWorkflowBuilder.generateFromDescription(workflowDescription, department);

      if (result.success) {
        setSuccess('Workflow generated successfully with proper node connections!');
        if (onWorkflowCreated) {
          onWorkflowCreated(result.workflowId || '', result.webhookUrl);
        }
      } else {
        setError(result.error || 'Failed to generate workflow');
      }
    } catch (error: any) {
      setError(`Failed to generate workflow: ${error.message}`);
    } finally {
      setIsBuilding(false);
    }
  }, [workflowName, workflowDescription, department, onWorkflowCreated]);

  return (
    <div className={`bg-card border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-4 mb-6">
        <Workflow className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Enhanced Workflow Builder</h2>
          <p className="text-sm text-muted-foreground">Create complete n8n workflows with proper connections</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Enter workflow name..."
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Trigger Type
            </label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="webhook">Webhook</option>
              <option value="schedule">Schedule</option>
              <option value="manual">Manual</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Describe what this workflow should do..."
            rows={4}
            className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Integrations
          </label>
          <div className="flex flex-wrap gap-2">
            {availableIntegrations.map((integration) => (
              <button
                key={integration}
                onClick={() => {
                  setIntegrations(prev => 
                    prev.includes(integration) 
                      ? prev.filter(i => i !== integration)
                      : [...prev, integration]
                  );
                }}
                className={`px-4 py-2 rounded-md transition-colors ${
                  integrations.includes(integration)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {integration}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">Error</span>
            </div>
            <p className="text-sm text-destructive mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <span className="font-medium text-success">Success</span>
            </div>
            <p className="text-sm text-success mt-1">{success}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={generateWorkflow}
            disabled={isBuilding || !workflowName.trim() || !workflowDescription.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBuilding ? <Spinner size={16} /> : <Play className="h-4 w-4" />}
            <span>{isBuilding ? 'Generating...' : 'Generate Workflow'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkflowBuilder; 