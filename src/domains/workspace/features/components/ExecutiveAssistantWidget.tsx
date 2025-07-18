import React, { useState } from 'react';
import { Brain } from 'lucide-react';
import StreamingComposer from '@/shared/components/chat/StreamingComposer';
import { Button } from '@/shared/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/Dialog';

export const ExecutiveAssistantWidget: React.FC = () => {
  const [open, setOpen] = useState(false);

  // Define the context to be passed to the assistant
  const workspaceContext = {
    activeWidgets: [
      'AIInsightsWidget',
      'CalendarWidget',
      'TasksWidget',
      'IdeasWidget',
      'EmailWidget',
      'ProactiveAlertsWidget',
      'QuickActionsWidget',
      'FavoritesWidget',
      'RecentsWidget',
    ],
    currentPage: 'My Workspace',
  };

  return (
    <>
      <Button
        variant="secondary"
        size="icon"
        className="fixed bottom-6 right-6 shadow-lg rounded-full w-12 h-12 flex items-center justify-center z-50"
        onClick={() => setOpen(true)}
        aria-label="Open Executive Assistant"
      >
        <Brain className="w-6 h-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 w-full sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="p-4 border-b flex flex-row items-center gap-2">
            <Brain className="w-5 h-5" />
            <DialogTitle className="text-lg">Executive Assistant</DialogTitle>
            <DialogDescription>
              Chat with your AI-powered assistant. Press Esc to close the dialog.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-4 pt-2">
            <StreamingComposer agentId="executive" context={workspaceContext} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 