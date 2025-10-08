import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemoAuth } from '@/shared/hooks/useDemoAuth';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/components/ui/use-toast';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, demoUser, isDemoAuthenticated, signOutDemo } = useDemoAuth();
  const navigate = useNavigate();

  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  if (!isDemoMode || !isDemoAuthenticated) return null;

  const handleExit = async () => {
    // show confirmation modal
    setShowConfirm(true);
  };

  const confirmExit = async () => {
    setShowConfirm(false);
    await signOutDemo();
    navigate('/login');
    // Notify the user they have exited demo mode
    try {
      toast({ title: 'Exited Demo', description: 'You have left demo mode and have been signed out.', variant: 'info' });
    } catch (err) {
      // swallowing toast errors should not break navigation
      // no-op
    }
  };

  const cancelExit = () => setShowConfirm(false);

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-4 py-2 text-sm">
      <div className="max-w-6xl mx-auto flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">DEMO MODE</Badge>
          <div>
            <strong>{demoUser?.name ?? 'Demo User'}</strong>
            <span className="ml-2 text-muted-foreground">You are in a demo environment with sample data.</span>
          </div>
        </div>
        <div>
          <Button size="sm" variant="ghost" onClick={handleExit}>Exit Demo</Button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true">
          <div className="bg-background rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Exit Demo?</h3>
            <p className="text-sm text-muted-foreground mb-4">Are you sure you want to exit demo mode? This will clear demo data and return you to the login screen.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={cancelExit}>Cancel</Button>
              <Button onClick={confirmExit}>Exit Demo</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoBanner;
