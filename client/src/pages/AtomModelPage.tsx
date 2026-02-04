import React, { useEffect, useMemo, useState } from 'react';
import { useAuthentikAuth } from '@/shared/contexts/AuthentikAuthContext';

type AtomRegistry = {
  version: number;
  updatedAt?: string;
  layers?: Record<string, { label: string; description?: string }>;
  entities?: Record<
    string,
    {
      label: string;
      layer: 'nucleus' | 'constraint' | 'electron' | 'energy' | string;
      authority?: string;
      stability?: string;
      changePolicy?: {
        requiresDecision?: boolean;
        requiresApproval?: string;
        allowsAutoUpdate?: boolean;
      };
      api?: {
        routes?: Record<string, { method: string; path: string }>;
      };
      notes?: string;
    }
  >;
  principles?: Record<string, unknown>;
};

const layerOrder = ['nucleus', 'constraint', 'electron', 'energy'];

export default function AtomModelPage() {
  const { session } = useAuthentikAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registry, setRegistry] = useState<AtomRegistry | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const token = session?.session?.accessToken;
        if (!token) {
          throw new Error('No access token available (not authenticated)');
        }

        const resp = await fetch('/api/atom-registry', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const json = await resp.json();
        if (!resp.ok || !json?.success) {
          throw new Error(json?.error || `Request failed (${resp.status})`);
        }
        if (mounted) setRegistry(json.data);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load Atom Registry');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [session?.session?.accessToken]);

  const grouped = useMemo(() => {
    const entities = registry?.entities || {};
    const groups: Record<string, Array<[string, any]>> = {};
    for (const [key, entry] of Object.entries(entities)) {
      const layer = entry.layer || 'unknown';
      groups[layer] ||= [];
      groups[layer].push([key, entry]);
    }
    for (const layer of Object.keys(groups)) {
      groups[layer].sort((a, b) => (a[1].label || a[0]).localeCompare(b[1].label || b[0]));
    }
    return groups;
  }, [registry]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nexus Atom Model</h1>
        <p className="text-sm text-muted-foreground">
          The Atom Registry is the shared contract that classifies business objects as nucleus/constraints/electrons/energy,
          and defines which mutations require explicit decision context.
        </p>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading Atom Registry…</div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {registry && (
        <div className="space-y-6">
          <div className="rounded-md border bg-background p-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div><span className="font-medium">Version:</span> {registry.version}</div>
              {registry.updatedAt && (<div><span className="font-medium">Updated:</span> {new Date(registry.updatedAt).toISOString()}</div>)}
            </div>
            {registry.principles && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Principles:</span>{' '}
                {Object.keys(registry.principles).join(', ')}
              </div>
            )}
          </div>

          {(layerOrder as string[]).map((layerKey) => {
            const layerMeta = registry.layers?.[layerKey];
            const items = grouped[layerKey] || [];
            if (!items.length) return null;

            return (
              <section key={layerKey} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">{layerMeta?.label || layerKey}</h2>
                  {layerMeta?.description && (
                    <p className="text-sm text-muted-foreground">{layerMeta.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(([key, entry]) => (
                    <div key={key} className="rounded-md border bg-background p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{entry.label}</div>
                          <div className="text-xs text-muted-foreground">key: {key}</div>
                        </div>
                        <div className="text-xs rounded-full border px-2 py-1">
                          {entry.stability || '—'}
                        </div>
                      </div>

                      <div className="text-sm">
                        <div><span className="font-medium">Authority:</span> {entry.authority || '—'}</div>
                        <div>
                          <span className="font-medium">Decision required (update/delete):</span>{' '}
                          {entry.changePolicy?.requiresDecision ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <span className="font-medium">Approval:</span> {entry.changePolicy?.requiresApproval || '—'}
                        </div>
                        <div>
                          <span className="font-medium">Auto-update:</span> {entry.changePolicy?.allowsAutoUpdate ? 'Allowed' : 'No'}
                        </div>
                      </div>

                      {entry.api?.routes && (
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium text-foreground">API</div>
                          <ul className="list-disc ml-5">
                            {Object.entries(entry.api.routes).map(([name, r]) => (
                              <li key={name}>{name}: {r.method} {r.path}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {entry.notes && (
                        <div className="text-xs text-muted-foreground">{entry.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {Object.keys(grouped)
            .filter((k) => !layerOrder.includes(k))
            .map((layerKey) => (
              <section key={layerKey} className="space-y-3">
                <h2 className="text-lg font-semibold">{layerKey}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(grouped[layerKey] || []).map(([key, entry]) => (
                    <div key={key} className="rounded-md border bg-background p-4">
                      <div className="font-medium">{entry.label}</div>
                      <div className="text-xs text-muted-foreground">key: {key}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
