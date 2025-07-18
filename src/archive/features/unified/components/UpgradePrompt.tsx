import React from 'react';
import { Button } from '@/shared/components/ui/Button';

interface UpgradePromptProps {
  feature: string;
  onUpgrade?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ feature, onUpgrade }) => {
  return (
    <div className="p-6 border rounded bg-muted/30 text-center">
      <div className="text-lg font-semibold mb-2">Unlock {feature}</div>
      <div className="text-muted-foreground mb-4">Upgrade to Pro to access this feature and more AI-powered productivity tools.</div>
      <Button onClick={onUpgrade || (() => alert('Upgrade flow coming soon!'))}>
        Upgrade to Pro
      </Button>
    </div>
  );
};

export default UpgradePrompt; 