/**
 * Audit Page - Security & Billing Overview
 *
 * Simple, expandable audit dashboard showing:
 * - Security: Data access tracking, conversation history
 * - Billing: Credit usage, subscription status
 */

import React, { useState, useEffect } from 'react';
import { Shield, CreditCard, MessageSquare, TrendingUp, Clock, Lock } from 'lucide-react';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';

interface AuditData {
  security: {
    totalConversations: number;
    lastActivity: string | null;
    dataPointsAccessed: number;
  };
  billing: {
    balanceCents: number;
    planName: string;
    tier: string;
    periodUsageCents: number;
    periodRequests: number;
  };
}

export const AuditPage: React.FC = () => {
  const { fetchWithAuth } = useAuthenticatedApi();
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAuditData() {
      try {
        // Fetch usage data (includes billing info)
        const usageRes = await fetchWithAuth('/api/audit/usage?period=30d');
        const usageData = usageRes.ok ? await usageRes.json() : null;

        // Fetch conversations summary
        const convRes = await fetchWithAuth('/api/audit/conversations?limit=1');
        const convData = convRes.ok ? await convRes.json() : null;

        if (usageData?.success && convData?.success) {
          setData({
            security: {
              totalConversations: convData.data.pagination.total,
              lastActivity: convData.data.conversations[0]?.updated_at || null,
              dataPointsAccessed: usageData.data.period.totals.total_tokens || 0
            },
            billing: {
              balanceCents: usageData.data.balance.cents,
              planName: usageData.data.subscription?.plan_name || 'Explorer',
              tier: usageData.data.subscription?.features?.tier || 'basic',
              periodUsageCents: usageData.data.period.totals.total_cost_cents || 0,
              periodRequests: usageData.data.period.totals.total_requests || 0
            }
          });
        } else {
          // Fallback for new users with no data
          setData({
            security: { totalConversations: 0, lastActivity: null, dataPointsAccessed: 0 },
            billing: { balanceCents: 0, planName: 'Explorer', tier: 'basic', periodUsageCents: 0, periodRequests: 0 }
          });
        }
      } catch (err) {
        console.error('Failed to load audit data:', err);
        setError('Unable to load audit data');
      } finally {
        setLoading(false);
      }
    }

    loadAuditData();
  }, [fetchWithAuth]);

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No activity yet';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">Audit & Transparency</h1>
        <p className="text-slate-400 mt-1">
          Your data security and usage at a glance
        </p>
      </div>

      {/* Security Panel */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Shield className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-100">Data Security</h2>
            <p className="text-sm text-slate-400">How we handle your information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <MessageSquare className="h-4 w-4" />
              <span>Conversations</span>
            </div>
            <p className="text-2xl font-semibold text-slate-100">
              {data?.security.totalConversations || 0}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Clock className="h-4 w-4" />
              <span>Last Activity</span>
            </div>
            <p className="text-sm font-medium text-slate-100">
              {formatDate(data?.security.lastActivity || null)}
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <TrendingUp className="h-4 w-4" />
              <span>Tokens Processed</span>
            </div>
            <p className="text-2xl font-semibold text-slate-100">
              {(data?.security.dataPointsAccessed || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Lock className="h-5 w-5 text-green-400 mt-0.5" />
          <div className="text-sm">
            <p className="text-green-300 font-medium">Self-Hosted. Your Data Stays Yours.</p>
            <p className="text-slate-400 mt-1">
              Assist runs in your own environment. Your conversations and business data are never stored
              by external AI providers, eliminating risk from third-party data breaches. All data is
              encrypted at rest and in transit. Export or delete anytime.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>No data sent to AI training</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Provider-agnostic routing</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Your infrastructure, your control</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Zero vendor lock-in</span>
          </div>
        </div>
      </div>

      {/* Billing Panel */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <CreditCard className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-100">Billing & Usage</h2>
            <p className="text-sm text-slate-400">Your plan and credit consumption</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Current Plan</p>
            <p className="text-xl font-semibold text-slate-100">{data?.billing.planName}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${
              data?.billing.tier === 'premium' ? 'bg-purple-500/20 text-purple-300' :
              data?.billing.tier === 'standard' ? 'bg-blue-500/20 text-blue-300' :
              'bg-slate-600/50 text-slate-300'
            }`}>
              {data?.billing.tier?.charAt(0).toUpperCase()}{data?.billing.tier?.slice(1)} Tier
            </span>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Credit Balance</p>
            <p className="text-xl font-semibold text-slate-100">
              {formatCurrency(data?.billing.balanceCents || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Available for AI requests
            </p>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
          <p className="text-sm text-slate-400 mb-3">Last 30 Days</p>
          <div className="flex gap-6">
            <div>
              <p className="text-slate-500 text-xs">Spent</p>
              <p className="text-lg font-medium text-slate-200">
                {formatCurrency(data?.billing.periodUsageCents || 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs">Requests</p>
              <p className="text-lg font-medium text-slate-200">
                {data?.billing.periodRequests || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-xs text-slate-500">
        Need detailed reports? Contact support to enable advanced audit logging.
      </p>
    </div>
  );
};

export default AuditPage;
