/**
 * Knowledge Page
 *
 * Read-only working knowledge graph entrypoint for:
 * - Assistant Core (how Nexus is configured to behave)
 * - About You (what Nexus currently knows about the user/company)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brain,
  Building2,
  CheckCircle,
  RefreshCw,
  Shield,
  Target,
  User
} from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useToast } from '@/shared/components/ui/use-toast';
import { useSearchParams } from 'react-router-dom';

interface UserProfile {
  name: string;
  role: string;
  preferences: string;
  updatedAt?: string;
}

interface BusinessProfile {
  name: string;
  industry: string;
  size: string;
  stage: string;
  description: string;
  updatedAt?: string;
}

interface Initiative {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'planned' | 'completed';
}

interface Insight {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface KnowledgeState {
  user: UserProfile;
  business: BusinessProfile;
  initiatives: Initiative[];
  insights: Insight[];
  conversationCount: number;
  assistantCore: {
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
  };
  context: KnowledgeContext;
}

type ConfidenceLevel = 'high' | 'medium';

interface KnowledgeFact {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: ConfidenceLevel;
  updatedAt: string;
}

type MemoryHorizon = 'short' | 'medium' | 'long';

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

function formatShortDate(value?: string): string {
  if (!value) return 'Unknown';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString();
}

function confidenceClasses(level: ConfidenceLevel): string {
  if (level === 'high') return 'text-emerald-300 bg-emerald-500/15';
  return 'text-amber-300 bg-amber-500/15';
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

function horizonClasses(horizon: MemoryHorizon): string {
  if (horizon === 'short') return 'text-emerald-300 bg-emerald-500/15';
  if (horizon === 'medium') return 'text-amber-300 bg-amber-500/15';
  return 'text-sky-300 bg-sky-500/15';
}

export default function KnowledgePage() {
  const { setPageTitle, setPageIcon } = useHeaderContext();
  const { fetchWithAuth } = useAuthenticatedApi();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const urlAgentId = searchParams.get('agent') || 'executive-assistant';
  const previousUrlAgentIdRef = useRef(urlAgentId);

  const [data, setData] = useState<KnowledgeState>({
    user: { name: '', role: '', preferences: '' },
    business: { name: '', industry: '', size: '', stage: '', description: '' },
    initiatives: [],
    insights: [],
    conversationCount: 0,
    assistantCore: {
      version: 'unknown',
      digest: 'unknown',
      agentId: 'executive-assistant',
      agentName: 'Unknown',
      agentRole: 'Unknown',
      availableAgents: [],
      facts: []
    },
    context: {
      contextBlocks: [],
      horizonUsage: { short: 0, medium: 0, long: 0 },
      sources: [],
      contextDigest: 'unknown',
      tokenEstimate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(urlAgentId);

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
    setLoading(prev => (showToast ? prev : true));
    setRefreshing(showToast);
    try {
      const userRes = await fetchWithAuth('/api/me');
      const userData = userRes.ok ? await userRes.json() : { data: null };

      const companyRes = await fetchWithAuth('/api/companies/current');
      const companyData = companyRes.ok ? await companyRes.json() : { data: null };

      const ticketsRes = await fetchWithAuth('/api/db/brain_tickets?limit=10&order=created_at.desc');
      const ticketsData = ticketsRes.ok ? await ticketsRes.json() : { data: [] };

      const thoughtsRes = await fetchWithAuth('/api/db/thoughts?limit=10&order=created_at.desc');
      const thoughtsData = thoughtsRes.ok ? await thoughtsRes.json() : { data: [] };

      const convRes = await fetchWithAuth('/api/audit/conversations?limit=1');
      const convData = convRes.ok ? await convRes.json() : { data: { pagination: { total: 0 } } };

      const assistantCoreRes = await fetchWithAuth(`/api/knowledge/assistant-core?agentId=${encodeURIComponent(selectedAgentId)}`);
      const assistantCorePayload = assistantCoreRes.ok ? await assistantCoreRes.json() : { data: null };
      const contextRes = await fetchWithAuth(`/api/knowledge/context?agentId=${encodeURIComponent(selectedAgentId)}&maxBlocks=10`);
      const contextPayload = contextRes.ok ? await contextRes.json() : { data: null };

      const profile = userData.data || {};
      const company = companyData.data || {};
      const assistantCoreData = assistantCorePayload.data && typeof assistantCorePayload.data === 'object'
        ? assistantCorePayload.data
        : {};

      const assistantCoreFactsRaw = Array.isArray((assistantCoreData as { facts?: unknown[] }).facts)
        ? (assistantCoreData as { facts: unknown[] }).facts
        : [];
      const assistantCoreFacts = assistantCoreFactsRaw
        .map(normalizeKnowledgeFact)
        .filter((fact): fact is KnowledgeFact => fact !== null);
      const availableAgentsRaw = Array.isArray((assistantCoreData as { availableAgents?: unknown[] }).availableAgents)
        ? (assistantCoreData as { availableAgents: unknown[] }).availableAgents
        : [];
      const availableAgents = availableAgentsRaw
        .filter((agent): agent is { id: string; name: string; role: string } => {
          if (!agent || typeof agent !== 'object') return false;
          const candidate = agent as Record<string, unknown>;
          return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.role === 'string';
        });
      const resolvedAgentId = typeof (assistantCoreData as { agentId?: unknown }).agentId === 'string'
        ? (assistantCoreData as { agentId: string }).agentId
        : selectedAgentId;
      if (resolvedAgentId !== selectedAgentId) {
        setSelectedAgentId(resolvedAgentId);
      }

      const contextData = contextPayload.data && typeof contextPayload.data === 'object'
        ? contextPayload.data as Record<string, unknown>
        : {};
      const contextBlocksRaw = Array.isArray(contextData.contextBlocks) ? contextData.contextBlocks : [];
      const contextBlocks = contextBlocksRaw
        .map(normalizeContextBlock)
        .filter((block): block is KnowledgeContextBlock => block !== null);
      const horizonUsageRaw = contextData.horizonUsage && typeof contextData.horizonUsage === 'object'
        ? contextData.horizonUsage as Record<string, unknown>
        : {};
      const sourcesRaw = Array.isArray(contextData.sources) ? contextData.sources : [];
      const sources = sourcesRaw
        .filter((source): source is { id: string; type: string } => {
          if (!source || typeof source !== 'object') return false;
          const candidate = source as Record<string, unknown>;
          return typeof candidate.id === 'string' && typeof candidate.type === 'string';
        });

      setData({
        user: {
          name: profile.display_name || profile.name || '',
          role: profile.role || profile.job_title || '',
          preferences: profile.preferences?.communication_style || '',
          updatedAt: profile.updated_at
        },
        business: {
          name: company.name || '',
          industry: company.industry || '',
          size: company.size || company.employee_count || '',
          stage: company.stage || '',
          description: company.description || '',
          updatedAt: company.updated_at
        },
        initiatives: (ticketsData.data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status === 'open' ? 'active' : t.status === 'closed' ? 'completed' : 'planned'
        })),
        insights: (thoughtsData.data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          content: t.content,
          created_at: t.created_at
        })),
        conversationCount: convData.data?.pagination?.total || 0,
        assistantCore: {
          version: typeof (assistantCoreData as { version?: unknown }).version === 'string'
            ? (assistantCoreData as { version: string }).version
            : 'unknown',
          digest: typeof (assistantCoreData as { digest?: unknown }).digest === 'string'
            ? (assistantCoreData as { digest: string }).digest
            : 'unknown',
          agentId: resolvedAgentId,
          agentName: typeof (assistantCoreData as { agentName?: unknown }).agentName === 'string'
            ? (assistantCoreData as { agentName: string }).agentName
            : 'Unknown',
          agentRole: typeof (assistantCoreData as { agentRole?: unknown }).agentRole === 'string'
            ? (assistantCoreData as { agentRole: string }).agentRole
            : 'Unknown',
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
        toast({ title: 'Knowledge refreshed', description: 'Latest working knowledge has been synced.' });
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

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  const aboutYouFacts: KnowledgeFact[] = useMemo(() => {
    const facts: KnowledgeFact[] = [];

    if (data.user.name) {
      facts.push({
        id: 'user-name',
        label: 'Name',
        value: data.user.name,
        source: 'User profile',
        confidence: 'high',
        updatedAt: data.user.updatedAt || new Date().toISOString()
      });
    }

    if (data.user.role) {
      facts.push({
        id: 'user-role',
        label: 'Role',
        value: data.user.role,
        source: 'User profile',
        confidence: 'high',
        updatedAt: data.user.updatedAt || new Date().toISOString()
      });
    }

    if (data.user.preferences) {
      facts.push({
        id: 'user-preferences',
        label: 'Communication Preference',
        value: data.user.preferences,
        source: 'User preferences',
        confidence: 'medium',
        updatedAt: data.user.updatedAt || new Date().toISOString()
      });
    }

    if (data.business.name) {
      facts.push({
        id: 'business-name',
        label: 'Company',
        value: data.business.name,
        source: 'Company profile',
        confidence: 'high',
        updatedAt: data.business.updatedAt || new Date().toISOString()
      });
    }

    if (data.business.industry) {
      facts.push({
        id: 'business-industry',
        label: 'Industry',
        value: data.business.industry,
        source: 'Company profile',
        confidence: 'high',
        updatedAt: data.business.updatedAt || new Date().toISOString()
      });
    }

    if (data.business.stage) {
      facts.push({
        id: 'business-stage',
        label: 'Stage',
        value: data.business.stage,
        source: 'Company profile',
        confidence: 'medium',
        updatedAt: data.business.updatedAt || new Date().toISOString()
      });
    }

    return facts;
  }, [data.business, data.user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const activeInitiatives = data.initiatives.filter(i => i.status === 'active').slice(0, 3);
  const assistantCoreFacts = data.assistantCore.facts;
  const availableAgents = data.assistantCore.availableAgents.length > 0
    ? data.assistantCore.availableAgents
    : [{ id: data.assistantCore.agentId, name: data.assistantCore.agentName, role: data.assistantCore.agentRole }];
  const domainCount = [assistantCoreFacts.length > 0, aboutYouFacts.length > 0].filter(Boolean).length;
  const memoryBlocks = data.context.contextBlocks;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Knowledge Graph</h1>
          <p className="text-slate-400 mt-1">
            Structured working knowledge Nexus uses to reason and personalize responses.
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-300" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Assistant Core</h2>
          </div>
          <p className="text-sm text-slate-400">
            Runtime behavior definitions for the assistant. This card is read-only.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="assistant-core-agent" className="text-xs text-slate-400 uppercase tracking-wide">
              Assistant
            </label>
            <select
              id="assistant-core-agent"
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
          <p className="text-xs text-slate-500">
            Agent: {data.assistantCore.agentName} ({data.assistantCore.agentRole}) | Version: {data.assistantCore.version} | Digest: {data.assistantCore.digest}
          </p>
          <div className="space-y-3">
            {assistantCoreFacts.length > 0 ? assistantCoreFacts.map((fact) => (
              <div key={fact.id} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{fact.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceClasses(fact.confidence)}`}>
                    {fact.confidence}
                  </span>
                </div>
                <p className="text-sm text-slate-100 mt-1">{fact.value}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Source: {fact.source} | Updated: {formatShortDate(fact.updatedAt)}
                </p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                Assistant core facts are unavailable. Try refreshing.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-300" />
            <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">About You</h2>
          </div>
          <p className="text-sm text-slate-400">
            Current user and company facts used for context injection and recommendations.
          </p>
          <div className="space-y-3">
            {aboutYouFacts.length > 0 ? aboutYouFacts.map((fact) => (
              <div key={fact.id} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{fact.label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${confidenceClasses(fact.confidence)}`}>
                    {fact.confidence}
                  </span>
                </div>
                <p className="text-sm text-slate-100 mt-1">{fact.value}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Source: {fact.source} | Updated: {formatShortDate(fact.updatedAt)}
                </p>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                No personal knowledge facts are available yet. Complete profile and company setup to enrich this domain.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-orange-300" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Current Focus</h3>
        </div>
        {activeInitiatives.length > 0 ? (
          <div className="space-y-2">
            {activeInitiatives.map((initiative) => (
              <div key={initiative.id} className="flex items-start gap-2 text-slate-300">
                <CheckCircle className="h-4 w-4 text-orange-300 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">{initiative.title}</p>
                  {initiative.description ? (
                    <p className="text-xs text-slate-500">{initiative.description.substring(0, 120)}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No active initiatives yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-emerald-300" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Memory Horizons</h3>
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
          Sources: {data.context.sources.length > 0 ? data.context.sources.map((s) => s.id).join(', ') : 'none'}
        </p>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-teal-300" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Context Blocks</h3>
        </div>
        {memoryBlocks.length > 0 ? (
          <div className="space-y-3">
            {memoryBlocks.map((block) => (
              <div key={block.id} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400 uppercase tracking-wide">{block.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${horizonClasses(block.horizon)}`}>
                    {block.horizon}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {block.subjectType} • {block.domain}
                </p>
                <p className="text-sm text-slate-100 mt-2 whitespace-pre-wrap">{block.content}</p>
                <p className="text-xs text-slate-500 mt-2">
                  Source: {block.source} | Updated: {formatShortDate(block.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No context blocks assembled yet.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-green-300" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide">Domain Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Conversations</p>
            <p className="text-slate-100 font-medium">{data.conversationCount}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Insights</p>
            <p className="text-slate-100 font-medium">{data.insights.length}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Active Initiatives</p>
            <p className="text-slate-100 font-medium">{activeInitiatives.length}</p>
          </div>
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
            <p className="text-slate-500">Knowledge Domains</p>
            <p className="text-slate-100 font-medium">{domainCount} Active</p>
          </div>
        </div>
      </section>
    </div>
  );
}
