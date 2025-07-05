import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/core/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { sendAuditLog } from '@/lib/services/auditLogService';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Action {
  id: string;
  label: string;
  eventType?: string;
  metadata?: Record<string, any>;
}

export interface ActionCardRecord {
  id: string;
  title: string;
  description?: string | null;
  actions?: Action[];
  metadata?: Record<string, any>;
}

export interface ActionCardProps {
  card: ActionCardRecord;
  /**
   * Called after an action is successfully executed so parent components can
   * refresh data or update UI.
   */
  onCompleted?: (action: Action) => void;
  /**
   * Optionally override the Supabase client if a shared instance exists.
   */
  supabaseClient?: SupabaseClient;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const ActionCard: React.FC<ActionCardProps> = ({
  card,
  onCompleted,
  supabaseClient,
  className = '',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const client = supabaseClient ?? supabase;

  const handleExecute = useCallback(
    async (action: Action) => {
      try {
        setExecutingActionId(action.id);

        // Get current user
        const {
          data: { user },
          error: userErr,
        } = await client.auth.getUser();
        if (userErr) throw userErr;
        if (!user) throw new Error('User must be logged in to execute an action');

        const { error } = await client.functions.invoke('ai_execute_action', {
          body: {
            actionCardId: card.id,
            userId: user.id,
            eventType: action.eventType ?? 'execute',
            metadata: action.metadata ?? {},
          },
        });
        if (error) throw error;

        toast.success('Action executed');

        // Fire first_action audit log once per browser session
        if (!sessionStorage.getItem('first_action_logged')) {
          sendAuditLog('first_action', { actionId: action.id, cardId: card.id });
          sessionStorage.setItem('first_action_logged', '1');
        }

        setModalOpen(false);
        onCompleted?.(action);
      } catch (err: any) {
        console.error('[ActionCard] Execution failed', err);
        toast.error(err?.message ?? 'Failed to execute action');
      } finally {
        setExecutingActionId(null);
      }
    },
    [card.id, client, onCompleted],
  );

  return (
    <div
      className={`bg-card text-card-foreground border border-border rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={() => setModalOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') setModalOpen(true);
      }}
      aria-label={`Open action card ${card.title}`}
    >
      <h3 className="text-lg font-semibold mb-2 line-clamp-1">{card.title}</h3>
      {card.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
      )}

      {/* Badge for number of actions */}
      {card.actions?.length ? (
        <span className="mt-2 inline-flex items-center text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
          {card.actions.length} action{card.actions.length > 1 ? 's' : ''}
        </span>
      ) : null}

      {/* Modal ---------------------------------------------*/}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={card.title}>
        {card.description && <p className="text-sm mb-4 whitespace-pre-wrap">{card.description}</p>}

        {card.actions && card.actions.length > 0 ? (
          <div className="space-y-3">
            {card.actions.map((action) => (
              <Button
                key={action.id}
                variant="default"
                className="w-full justify-start"
                isLoading={executingActionId === action.id}
                onClick={() => handleExecute(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No executable actions.</p>
        )}
      </Modal>
    </div>
  );
};

export default ActionCard; 