import React, { useEffect, useMemo, useState } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';

type CoolifyApp = {
  uuid: string;
  name: string;
  status?: string;
  fqdn?: string;
};

type CoolifyDb = {
  uuid: string;
  name: string;
  status?: string;
};

function getAccessToken(session: any): string | null {
  return session?.session?.accessToken || session?.accessToken || null;
}

function statusVariant(status?: string) {
  const s = (status || '').toLowerCase();
  if (s.includes('healthy') || s === 'running') return 'default';
  if (s.includes('unhealthy') || s.includes('exited') || s.includes('error')) return 'destructive';
  if (s.includes('unknown') || s.includes('degraded')) return 'secondary';
  return 'secondary';
}

export default function CoolifyOpsPage() {
  const { session } = useAuthentikAuth();
  const token = useMemo(() => getAccessToken(session), [session]);

  const [apps, setApps] = useState<CoolifyApp[]>([]);
  const [dbs, setDbs] = useState<CoolifyDb[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<CoolifyApp | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<string>('');
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'restart' | 'deploy' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  async function apiFetch(path: string, init?: RequestInit) {
    if (!token) throw new Error('No access token in session');
    const res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {})
      }
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json?.error || json?.message || `Request failed (${res.status})`;
      throw new Error(msg);
    }
    return json;
  }

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [appsResp, dbsResp] = await Promise.all([
        apiFetch('/api/ops/coolify/apps'),
        apiFetch('/api/ops/coolify/dbs')
      ]);
      setApps((appsResp.data || []) as CoolifyApp[]);
      setDbs((dbsResp.data || []) as CoolifyDb[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // light polling for near-realtime
    const t = setInterval(() => void refresh(), 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function openLogs(app: CoolifyApp) {
    setSelectedApp(app);
    setLogsOpen(true);
    setLogs('Loading logs...');
    try {
      const resp = await apiFetch(`/api/ops/coolify/apps/${app.uuid}/logs`);
      const data = resp.data;
      if (typeof data === 'string') {
        setLogs(data);
      } else {
        setLogs(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      setLogs(e instanceof Error ? e.message : 'Failed to fetch logs');
    }
  }

  function requestAction(app: CoolifyApp, type: 'restart' | 'deploy') {
    setSelectedApp(app);
    setActionType(type);
    setActionReason('');
    setActionOpen(true);
  }

  async function runAction() {
    if (!selectedApp || !actionType) return;

    setActionBusy(true);
    try {
      const resp = await apiFetch(`/api/ops/coolify/apps/${selectedApp.uuid}/${actionType}`, {
        method: 'POST',
        body: JSON.stringify({ confirm: true, reason: actionReason })
      });

      // Show result in logs dialog for instant feedback
      setLogsOpen(true);
      setLogs(JSON.stringify(resp, null, 2));
      setActionOpen(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ops Command Center</h1>
          <p className="text-muted-foreground">Coolify visibility + approve-first actions (restart/deploy/logs)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-destructive">{error}</div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apps.length === 0 ? (
              <div className="text-sm text-muted-foreground">No apps found.</div>
            ) : (
              <div className="space-y-2">
                {apps.map((app) => (
                  <div key={app.uuid} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border rounded-lg p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium truncate">{app.name}</div>
                        <Badge variant={statusVariant(app.status) as any}>{app.status || 'unknown'}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{app.uuid}</div>
                      {app.fqdn ? (
                        <a className="text-xs text-primary underline truncate" href={app.fqdn.split(',')[0]} target="_blank" rel="noreferrer">
                          {app.fqdn}
                        </a>
                      ) : null}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" onClick={() => void openLogs(app)}>
                        Logs
                      </Button>
                      <Button variant="outline" onClick={() => requestAction(app, 'restart')}>
                        Restart
                      </Button>
                      <Button onClick={() => requestAction(app, 'deploy')}>
                        Deploy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Databases</CardTitle>
        </CardHeader>
        <CardContent>
          {dbs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No databases found.</div>
          ) : (
            <div className="space-y-2">
              {dbs.map((db) => (
                <div key={db.uuid} className="flex items-center justify-between gap-3 border rounded-lg p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium truncate">{db.name}</div>
                      <Badge variant={statusVariant(db.status) as any}>{db.status || 'unknown'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{db.uuid}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logs / Result</DialogTitle>
            <DialogDescription>
              {selectedApp ? `${selectedApp.name} (${selectedApp.uuid})` : 'Output'}
            </DialogDescription>
          </DialogHeader>
          <pre className="text-xs max-h-[60vh] overflow-auto rounded-md bg-muted p-3 whitespace-pre-wrap">{logs}</pre>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm {actionType}</DialogTitle>
            <DialogDescription>
              {selectedApp ? `${selectedApp.name} (${selectedApp.uuid})` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm">Reason (optional, goes into audit log)</div>
            <Input value={actionReason} onChange={(e) => setActionReason(e.target.value)} placeholder="e.g. unhealthy; redeploy after env var change" />
            <div className="text-xs text-muted-foreground">
              This is approve-first: nothing runs until you confirm.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)} disabled={actionBusy}>
              Cancel
            </Button>
            <Button onClick={() => void runAction()} disabled={actionBusy}>
              {actionBusy ? 'Working…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
