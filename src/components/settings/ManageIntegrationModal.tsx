import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { supabase } from '../../lib/core/supabase';
import { Button } from '@/components/ui/Button';

interface IntegrationDetails {
  id: string;
  provider: string;
  org_id: string;
  created_at: string;
  expires_at?: string;
  status?: string;
  last_sync?: string;
  [key: string]: any; // For provider-specific fields
}

interface ManageIntegrationModalProps {
  provider: string | null;
  open: boolean;
  onClose: () => void;
  orgId: string;
}

export const ManageIntegrationModal: React.FC<ManageIntegrationModalProps> = ({ provider, open, onClose, orgId }) => {
  const [details, setDetails] = useState<IntegrationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !provider) return;

    async function fetchDetails() {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('ai_integrations')
        .select('*')
        .eq('org_id', orgId)
        .eq('provider', provider)
        .maybeSingle();
      if (error) setError(error.message);
      else setDetails(data);
      setLoading(false);
    }

    fetchDetails();
  }, [open, provider, orgId]);

  const handleDisconnect = async () => {
    if (!provider) return;
    if (!confirm('Disconnect integration? This cannot be undone.')) return;
    const { error } = await (supabase as any)
      .from('ai_integrations')
      .delete()
      .eq('org_id', orgId)
      .eq('provider', provider);
    if (error) alert('Failed to disconnect');
    else onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Manage ${provider}`.toUpperCase()}>
      {loading && <p className="text-sm">Loading…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {details && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Connected on</p>
            <p className="font-medium">{new Date(details.created_at).toLocaleString()}</p>
          </div>
          {details.expires_at && (
            <div>
              <p className="text-sm text-muted-foreground">Token expires</p>
              <p className="font-medium">{new Date(details.expires_at).toLocaleString()}</p>
            </div>
          )}
          <div className="flex justify-between items-center pt-4">
            {provider === 'paypal' && (
              <Button
                variant="secondary"
                onClick={async () => {
                  setLoading(true);
                  const { error } = await supabase.functions.invoke('paypal_refresh_token', {
                    body: { orgId },
                  });
                  if (error) alert('Refresh failed');
                  else await new Promise((r) => setTimeout(r, 500)); // let realtime push update
                  setLoading(false);
                }}
              >
                Refresh Token
              </Button>
            )}
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDisconnect}>Disconnect</Button>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}; 