/**
 * Demo Banner Component
 * 
 * Displays when user is in demo mode to clearly indicate
 * that they're using demo data and features
 */

import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { useDemoAuth } from '@/shared/hooks/useDemoAuth';
import { DEMO_ACCOUNTS } from '@/shared/config/demoConfig';

interface DemoBannerProps {
  onClose?: () => void;
  showAccountInfo?: boolean;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ 
  onClose, 
  showAccountInfo = true 
}) => {
  const { isDemoMode, demoUser, signOutDemo } = useDemoAuth();
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isDemoMode || !isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const handleSignOut = async () => {
    await signOutDemo();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-300" />
            <div className="flex items-center space-x-4">
              <span className="font-semibold text-sm">
                🎭 Demo Mode Active
              </span>
              <span className="text-xs opacity-90">
                You're viewing demo data and features
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {showAccountInfo && demoUser && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="opacity-90">Logged in as:</span>
                <span className="font-medium">
                  {demoUser.name} ({demoUser.role})
                </span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-white hover:bg-white/10 text-xs"
              >
                Sign Out
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DemoAccountInfo: React.FC = () => {
  const { isDemoMode, demoUser } = useDemoAuth();

  if (!isDemoMode || !demoUser) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">
            Demo Account Information
          </h3>
          <div className="space-y-1 text-sm text-blue-800">
            <p><strong>Name:</strong> {demoUser.name}</p>
            <p><strong>Role:</strong> {demoUser.role}</p>
            <p><strong>Company:</strong> {demoUser.company}</p>
            <p><strong>Permissions:</strong> {demoUser.permissions.join(', ')}</p>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            <p>💡 <strong>Demo Accounts Available:</strong></p>
            <ul className="mt-1 space-y-1">
              {DEMO_ACCOUNTS.map(account => (
                <li key={account.id}>
                  • {account.name} ({account.email}) - {account.role}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const DemoModeIndicator: React.FC = () => {
  const { isDemoMode } = useDemoAuth();

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-full">
      <span>🎭</span>
      <span>Demo</span>
    </div>
  );
}; 
