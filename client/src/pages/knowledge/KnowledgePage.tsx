/**
 * Knowledge Page (MVP Foundation)
 *
 * Read-only knowledge graph focused on:
 * - User Knowledge (what Nexus knows about the user/business)
 * - Agent Knowledge (assistant identity + operating memory)
 *
 * Source of truth is backend knowledge routes.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Brain, Database, RefreshCw, Shield, User, TrendingUp, Sparkles, Save, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/Dialog';
import { Textarea } from '@/shared/components/ui/Textarea';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useToast } from '@/shared/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';
import { ContinuousImprovementDashboard } from '@/lib/ai/components/ContinuousImprovementDashboard';
import { useAuth } from '@/hooks/index';

type MemoryHorizon = 'short' | 'medium' | 'long';
type ConfidenceLevel = 'high' | 'medium';

const HORIZON_ORDER: MemoryHorizon[] = ['short', 'medium', 'long'];

interface KnowledgeFact {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: ConfidenceLevel;
  updatedAt: string;
}

interface AgentTool {
  id: string;
  name: string;
  description: string;
}

interface KnowledgeContextBlock {
  id: string;
  title: string;
  horizon: MemoryHorizon;
  domain: string;
  subjectType: string;
  subjectId: string;
  content: string;
  source: string;
  updatedAt: string;
  confidence?: number | null;
}

interface KnowledgeContext {
  contextBlocks: KnowledgeContextBlock[];
  horizonUsage: Record<MemoryHorizon, number>;
  sources: Array<{ id: string; type: string }>;
  contextDigest: string;
  tokenEstimate: number;
}

interface AssistantCore {
  version: string;
  digest: string;
  agentId: string;
  agentName: string;
  agentRole: string;
  availableAgents: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  facts: KnowledgeFact[];
  tools?: AgentTool[];
}

interface UserSnapshot {
  name: string;
  role: string;
  email: string;
}

interface KnowledgeState {
  user: UserSnapshot;
  assistantCore: AssistantCore;
  context: KnowledgeContext;
}

function formatShortDate(value?: string): string {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString();
}

function normalizeKnowledgeFact(raw: unknown): KnowledgeFact | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;

  const label = typeof value.label === 'string' ? value.label.trim() : '';
  const factValue = typeof value.value === 'string' ? value.value.trim() : '';
  if (!label || !factValue) return null;

  const confidenceRaw = typeof value.confidence === 'string' ? value.confidence.toLowerCase() : 'medium';
  const confidence: ConfidenceLevel = confidenceRaw === 'high' ? 'high' : 'medium';

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : `fact-${label.toLowerCase().replace(/\s+/g, '-')}`,
    label,
    value: factValue,
    source: typeof value.source === 'string' && value.source.trim() ? value.source : 'Unknown source',
    confidence,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString()
  };
}

function normalizeHorizon(raw: unknown): MemoryHorizon {
  if (raw === 'short' || raw === 'medium' || raw === 'long') return raw;
  return 'medium';
}

function normalizeContextBlock(raw: unknown): KnowledgeContextBlock | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;

  if (typeof value.id !== 'string' || typeof value.title !== 'string' || typeof value.content !== 'string') {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    horizon: normalizeHorizon(value.horizon),
    domain: typeof value.domain === 'string' ? value.domain : 'general',
    subjectType: typeof value.subjectType === 'string' ? value.subjectType : 'unknown',
    subjectId: typeof value.subjectId === 'string' ? value.subjectId : 'unknown',
    content: value.content,
    source: typeof value.source === 'string' ? value.source : 'unknown',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
    confidence: typeof value.confidence === 'number' ? value.confidence : null
  };
}

function horizonPillClasses(horizon: MemoryHorizon): string {
  if (horizon === 'short') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25';
  if (horizon === 'medium') return 'text-amber-300 bg-amber-500/15 border-amber-500/25';
  return 'text-sky-300 bg-sky-500/15 border-sky-500/25';
}

function horizonLabel(horizon: MemoryHorizon): string {
  if (horizon === 'short') return 'Short-Term';
  if (horizon === 'medium') return 'Medium-Term';
  return 'Long-Term';
}

function confidenceClasses(level: ConfidenceLevel): string {
  if (level === 'high') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/25';
  return 'text-amber-300 bg-amber-500/15 border-amber-500/25';
}

function groupBlocksByHorizon(blocks: KnowledgeContextBlock[]): Record<MemoryHorizon, KnowledgeContextBlock[]> {
  return {
    short: blocks.filter((block) => block.horizon === 'short'),
    medium: blocks.filter((block) => block.horizon === 'medium'),
    long: blocks.filter((block) => block.horizon === 'long')
  };
}

function sortBlocks(blocks: KnowledgeContextBlock[]): KnowledgeContextBlock[] {
  return [...blocks].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export default function KnowledgePage() {
  const { setPageTitle, setPageIcon } = useHeaderContext();
  const { fetchWithAuth } = useAuthenticatedApi();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const urlAgentId = searchParams.get('agent') || 'executive-assistant';
  const previousUrlAgentIdRef = useRef(urlAgentId);

  const [selectedAgentId, setSelectedAgentId] = useState(urlAgentId);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSoulModalOpen, setIsSoulModalOpen] = useState(false);
  const [soulContent, setSoulContent] = useState('');
  const [isSavingSoul, setIsSavingSoul] = useState(false);
  const [isLoadingSoul, setIsLoadingSoul] = useState(false);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    const roles = user.groups || [];
    return roles.some(role =>
      ['owner', 'admin', 'Nexus Owners', 'Nexus Admins'].map(r => r.toLowerCase()).includes(role.toLowerCase())
    );
  }, [user]);

  const [data, setData] = useState<KnowledgeState>({
    user: {
      name: '',
      role: '',
      email: ''
    },
    assistantCore: {
      version: 'unknown',
      digest: 'unknown',
      agentId: 'executive-assistant',
      agentName: 'Unknown',
      agentRole: 'Unknown',
      availableAgents: [],
      facts: [],
      tools: []
    },
    context: {
      contextBlocks: [],
      horizonUsage: { short: 0, medium: 0, long: 0 },
      sources: [],
      contextDigest: 'unknown',
      tokenEstimate: 0
    }
  });

  useEffect(() => {
    setPageTitle('Knowledge');
    setPageIcon(<Brain className="h-5 w-5" />);
    return () => {
      setPageTitle('');
      setPageIcon(undefined);
    };
  }, [setPageTitle, setPageIcon]);

  useEffect(() => {
    if (previousUrlAgentIdRef.current !== urlAgentId) {
      previousUrlAgentIdRef.current = urlAgentId;
      setSelectedAgentId(urlAgentId);
    }
  }, [urlAgentId]);

  const loadKnowledge = useCallback(async (showToast = false) => {
    setLoading((prev) => (showToast ? prev : true));
    setRefreshing(showToast);

    try {
      const meRes = await fetchWithAuth('/api/me');
      const mePayload = meRes.ok ? await meRes.json() : { data: null };

      const assistantCoreRes = await fetchWithAuth(`/api/knowledge/assistant-core?agentId=${encodeURIComponent(selectedAgentId)}`);
      const assistantCorePayload = assistantCoreRes.ok ? await assistantCoreRes.json() : { data: null };

      const contextRes = await fetchWithAuth(`/api/knowledge/context?agentId=${encodeURIComponent(selectedAgentId)}&maxBlocks=12`);
      const contextPayload = contextRes.ok ? await contextRes.json() : { data: null };

      const meData = mePayload?.data && typeof mePayload.data === 'object'
        ? (mePayload.data as Record<string, unknown>)
        : {};

      const assistantCoreData = assistantCorePayload?.data && typeof assistantCorePayload.data === 'object'
        ? (assistantCorePayload.data as Record<string, unknown>)
        : {};

      const contextData = contextPayload?.data && typeof contextPayload.data === 'object'
        ? (contextPayload.data as Record<string, unknown>)
        : {};

      const assistantCoreFactsRaw = Array.isArray(assistantCoreData.facts) ? assistantCoreData.facts : [];
      const assistantCoreFacts = assistantCoreFactsRaw
        .map(normalizeKnowledgeFact)
        .filter((fact): fact is KnowledgeFact => fact !== null);

      const availableAgentsRaw = Array.isArray(assistantCoreData.availableAgents) ? assistantCoreData.availableAgents : [];
      const availableAgents = availableAgentsRaw
        .filter((agent): agent is { id: string; name: string; role: string } => {
          if (!agent || typeof agent !== 'object') return false;
          const candidate = agent as Record<string, unknown>;
          return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.role === 'string';
        });

      const resolvedAgentId = typeof assistantCoreData.agentId === 'string' ? assistantCoreData.agentId : selectedAgentId;
      if (resolvedAgentId !== selectedAgentId) {
        setSelectedAgentId(resolvedAgentId);
      }

      const contextBlocksRaw = Array.isArray(contextData.contextBlocks) ? contextData.contextBlocks : [];
      const contextBlocks = contextBlocksRaw
        .map(normalizeContextBlock)
        .filter((block): block is KnowledgeContextBlock => block !== null);

      const horizonUsageRaw = contextData.horizonUsage && typeof contextData.horizonUsage === 'object'
        ? (contextData.horizonUsage as Record<string, unknown>)
        : {};

      const sourcesRaw = Array.isArray(contextData.sources) ? contextData.sources : [];
      const sources = sourcesRaw
        .filter((source): source is { id: string; type: string } => {
          if (!source || typeof source !== 'object') return false;
          const candidate = source as Record<string, unknown>;
          return typeof candidate.id === 'string' && typeof candidate.type === 'string';
        });

      const firstName = typeof meData.first_name === 'string' ? meData.first_name : '';
      const lastName = typeof meData.last_name === 'string' ? meData.last_name : '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      setData({
        user: {
          name:
            (typeof meData.display_name === 'string' && meData.display_name)
            || (typeof meData.name === 'string' && meData.name)
            || fullName,
          role:
            (typeof meData.role === 'string' && meData.role)
            || (typeof meData.job_title === 'string' && meData.job_title)
            || '',
          email: typeof meData.email === 'string' ? meData.email : ''
        },
        assistantCore: {
          version: typeof assistantCoreData.version === 'string' ? assistantCoreData.version : 'unknown',
          digest: typeof assistantCoreData.digest === 'string' ? assistantCoreData.digest : 'unknown',
          agentId: resolvedAgentId,
          agentName: typeof assistantCoreData.agentName === 'string' ? assistantCoreData.agentName : 'Unknown',
          agentRole: typeof assistantCoreData.agentRole === 'string' ? assistantCoreData.agentRole : 'Unknown',
          availableAgents,
          facts: assistantCoreFacts
        },
        context: {
          contextBlocks,
          horizonUsage: {
            short: typeof horizonUsageRaw.short === 'number' ? horizonUsageRaw.short : 0,
            medium: typeof horizonUsageRaw.medium === 'number' ? horizonUsageRaw.medium : 0,
            long: typeof horizonUsageRaw.long === 'number' ? horizonUsageRaw.long : 0
          },
          sources,
          contextDigest: typeof contextData.contextDigest === 'string' ? contextData.contextDigest : 'unknown',
          tokenEstimate: typeof contextData.tokenEstimate === 'number' ? contextData.tokenEstimate : 0
        }
      });

      if (showToast) {
        toast({ title: 'Knowledge refreshed', description: 'Latest read-only knowledge has been synced from backend.' });
      }
    } catch {
      if (showToast) {
        toast({
          title: 'Refresh failed',
          description: 'Unable to sync knowledge at this time.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchWithAuth, selectedAgentId, toast]);

  const handleOpenSoulEditor = async () => {
    setIsSoulModalOpen(true);
    setIsLoadingSoul(true);
    try {
      const res = await fetchWithAuth('/api/admin/soul');
      if (res.ok) {
        const data = await res.json();
        setSoulContent(data.content || '');
      } else {
        toast({ title: 'Failed to load soul', description: 'Could not retrieve agent personality.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to connect to admin API.', variant: 'destructive' });
    } finally {
      setIsLoadingSoul(false);
    }
  };

  const handleSaveSoul = async () => {
    setIsSavingSoul(true);
    try {
      const res = await fetchWithAuth('/api/admin/soul', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: soulContent })
      });

      if (res.ok) {
        toast({ title: 'Soul updated', description: 'Agent personality has been updated successfully.' });
        setIsSoulModalOpen(false);
      } else {
        toast({ title: 'Update failed', description: 'Only owners or admins can update the soul.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save soul changes.', variant: 'destructive' });
    } finally {
      setIsSavingSoul(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  const availableAgents = data.assistantCore.availableAgents.length > 0
    ? data.assistantCore.availableAgents
    : [{ id: data.assistantCore.agentId, name: data.assistantCore.agentName, role: data.assistantCore.agentRole }];

  const userKnowledgeBlocks = useMemo(
    () => sortBlocks(data.context.contextBlocks.filter((block) => block.subjectType === 'user')),
    [data.context.contextBlocks]
  );
  const agentKnowledgeBlocks = useMemo(
    () => sortBlocks(data.context.contextBlocks.filter((block) => block.subjectType === 'agent')),
    [data.context.contextBlocks]
  );

  const userByHorizon = useMemo(() => groupBlocksByHorizon(userKnowledgeBlocks), [userKnowledgeBlocks]);
  const agentByHorizon = useMemo(() => groupBlocksByHorizon(agentKnowledgeBlocks), [agentKnowledgeBlocks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Knowledge Foundation</h1>
          <p className="text-slate-400 mt-1">
            Read-only structured knowledge graph for user and agent memory horizons.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadKnowledge(true)}
          disabled={refreshing}
          className="border-slate-700 text-slate-200"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-xs text-slate-400">
        Backend source of truth: <span className="text-slate-200">/api/knowledge/assistant-core</span> and{' '}
        <span className="text-slate-200">/api/knowledge/context</span>. Editing is intentionally disabled in MVP.
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-300" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">User Knowledge</h2>
          </div>
          <p className="text-sm text-slate-400">
            What Nexus currently knows about you and your business context.
          </p>

          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3 text-sm">
            <p className="text-slate-100 font-medium">{data.user.name || 'Unknown user'}</p>
            <p className="text-slate-400 text-xs mt-1">
              {data.user.role || 'Role not set'}{data.user.email ? ` • ${data.user.email}` : ''}
            </p>
          </div>

          <div className="space-y-3">
            {HORIZON_ORDER.map((horizon) => (
              <div key={horizon} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${horizonPillClasses(horizon)}`}>
                    {horizonLabel(horizon)}
                  </span>
                  <span className="text-xs text-slate-500">{userByHorizon[horizon].length} blocks</span>
                </div>

                {userByHorizon[horizon].length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {userByHorizon[horizon].map((block) => (
                      <article key={block.id} className="rounded-md border border-slate-700/60 bg-slate-950/40 p-2.5">
                        <p className="text-sm font-medium text-slate-100">{block.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {block.domain} • {block.source} • {formatShortDate(block.updatedAt)}
                        </p>
                        <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{block.content}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-3">No {horizonLabel(horizon).toLowerCase()} user blocks yet.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-300" />
              <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Agent Knowledge</h2>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenSoulEditor}
                className="h-8 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
              >
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Customize Soul
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Assistant core identity and memory blocks used to keep agent behavior consistent.
          </p>

          {data.assistantCore.tools && data.assistantCore.tools.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Agent Capabilities (Tools)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.assistantCore.tools.map((tool) => (
                  <div key={tool.id} className="group p-3 rounded-lg bg-slate-900/40 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">{tool.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{tool.id}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="knowledge-agent" className="text-xs text-slate-400 uppercase tracking-wide">
              Agent
            </label>
            <select
              id="knowledge-agent"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-200 max-w-xs"
            >
              {availableAgents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.role})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3 text-sm">
            <p className="text-slate-100 font-medium">{data.assistantCore.agentName}</p>
            <p className="text-slate-400 text-xs mt-1">
              {data.assistantCore.agentRole} • v{data.assistantCore.version} • {data.assistantCore.digest}
            </p>
          </div>

          <div className="space-y-2">
            {data.assistantCore.facts.length > 0 ? data.assistantCore.facts.map((fact) => (
              <div key={fact.id} className="rounded-md border border-slate-700/60 bg-slate-950/40 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{fact.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${confidenceClasses(fact.confidence)}`}>
                    {fact.confidence}
                  </span>
                </div>
                <p className="text-sm text-slate-100 mt-1">{fact.value}</p>
              </div>
            )) : (
              <p className="text-xs text-slate-500">Agent core facts are unavailable.</p>
            )}
          </div>

          <div className="space-y-3">
            {HORIZON_ORDER.map((horizon) => (
              <div key={horizon} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${horizonPillClasses(horizon)}`}>
                    {horizonLabel(horizon)}
                  </span>
                  <span className="text-xs text-slate-500">{agentByHorizon[horizon].length} blocks</span>
                </div>

                {agentByHorizon[horizon].length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {agentByHorizon[horizon].map((block) => (
                      <article key={block.id} className="rounded-md border border-slate-700/60 bg-slate-950/40 p-2.5">
                        <p className="text-sm font-medium text-slate-100">{block.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {block.domain} • {block.source} • {formatShortDate(block.updatedAt)}
                        </p>
                        <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{block.content}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-3">No {horizonLabel(horizon).toLowerCase()} agent blocks yet.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">AI Performance & Improvement</h2>
          </div>
          <p className="text-sm text-slate-400">
            Nexus performance metrics and behavioral improvements over time.
          </p>
          <div className="bg-slate-900/40 rounded-lg border border-slate-700/70 p-4">
            <ContinuousImprovementDashboard userId={user?.id || ''} timeframe="month" />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-4 w-4 text-emerald-300" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Context Metrics</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Short</p>
            <p className="text-slate-100 font-medium">{data.context.horizonUsage.short}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Medium</p>
            <p className="text-slate-100 font-medium">{data.context.horizonUsage.medium}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Long</p>
            <p className="text-slate-100 font-medium">{data.context.horizonUsage.long}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Est. Tokens</p>
            <p className="text-slate-100 font-medium">{data.context.tokenEstimate}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Digest</p>
            <p className="text-slate-100 font-medium text-xs truncate">{data.context.contextDigest}</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Sources: {data.context.sources.length > 0 ? data.context.sources.map((source) => source.id).join(', ') : 'none'}
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-slate-700 bg-slate-900/25 p-4 flex items-center gap-2 text-xs text-slate-400">
        <Bot className="h-4 w-4 text-indigo-300" />
        Future enhancement path: editable memory curation, shared/platform knowledge card, and multi-agent comparative view.
      </section>

      {/* Soul Editor Modal */}
      <Dialog open={isSoulModalOpen} onOpenChange={setIsSoulModalOpen}>
        <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              Customize Agent Soul
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Define the identity, philosophy, and proactive behaviors of Nexus. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingSoul ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
                <p className="text-slate-400">Summoning agent personality...</p>
              </div>
            ) : (
              <Textarea
                value={soulContent}
                onChange={(e) => setSoulContent(e.target.value)}
                placeholder="# Core Philosophy..."
                className="min-h-[400px] font-mono text-sm bg-slate-950 border-slate-800 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsSoulModalOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveSoul}
              disabled={isSavingSoul || isLoadingSoul}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSavingSoul ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
