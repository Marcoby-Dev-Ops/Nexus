import React from 'react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface Action {
  id: string;
  label: string;
  run: () => Promise<void>;
}

// Example operations actions
const ACTIONS: Action[] = [
  {
    id: 'run-uptime-audit',
    label: 'Trigger Uptime Audit',
    run: async () => {
      // Placeholder – integrate with n8n / external API
      await new Promise((res) => setTimeout(res, 800));
    },
  },
  {
    id: 'optimize-automation',
    label: 'Identify Automation Candidates',
    run: async () => {
      await new Promise((res) => setTimeout(res, 800));
    },
  },
];

const ActionList: React.FC = () => {
  const { showToast } = useToast();

  const handleRun = async (action: Action) => {
    await action.run();
    showToast({ title: 'Action completed', description: action.label, type: 'success' });
  };

  return (
    <div className="space-y-2">
      {ACTIONS.map((a) => (
        <Button key={a.id} onClick={() => handleRun(a)} className="w-full justify-start">
          {a.label}
        </Button>
      ))}
    </div>
  );
};

export default ActionList; 