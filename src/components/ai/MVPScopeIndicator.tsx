import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button.tsx';

interface MVPScopeIndicatorProps {
  onDismiss?: () => void;
  agentType?: string;
  compact?: boolean;
}

export const MVPScopeIndicator: React.FC<MVPScopeIndicatorProps> = ({ 
  onDismiss, 
  agentType = 'IT Support',
  compact = false
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (compact) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 dark: bg-amber-900/10 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-warning dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <strong>MVP:</strong> Specialized for {agentType} assistance
            </p>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-warning hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-1"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 dark: bg-amber-900/10 dark:border-amber-800">
      <div className="flex items-start gap-4">
        <AlertTriangle className="w-5 h-5 text-warning dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            🚀 MVP Version - Limited Scope
          </h4>
          <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
            <p>
              <strong>Current Focus:</strong> This initial version specializes in <strong>{agentType}</strong> assistance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="font-medium mb-1">✅ What's Working:</p>
                <ul className="text-xs space-y-1">
                  <li>• {agentType} guidance and troubleshooting</li>
                  <li>• Knowledge base search</li>
                  <li>• Basic task assistance</li>
                  <li>• Document queries</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium mb-1">🔄 Coming Soon:</p>
                <ul className="text-xs space-y-1">
                  <li>• Multi-department agents</li>
                  <li>• Advanced integrations</li>
                  <li>• File uploads</li>
                  <li>• Analytics dashboards</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/20 rounded text-xs">
              <strong>💡 Tip:</strong> For best results, ask specific {agentType.toLowerCase()} questions 
              like "How do I troubleshoot network connectivity?" or "What's the process for password resets?"
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-warning hover: text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}; 