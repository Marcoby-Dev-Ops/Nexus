/**
 * Knowledge Page - What Nexus Knows About You
 *
 * A coherent narrative view of what the AI understands about the user.
 * Users can review and correct any information to improve AI accuracy.
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  User,
  Building2,
  Target,
  Lightbulb,
  ListTodo,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useToast } from '@/shared/components/ui/use-toast';

interface UserProfile {
  name: string;
  role: string;
  preferences: string;
}

interface BusinessProfile {
  name: string;
  industry: string;
  size: string;
  stage: string;
  description: string;
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
}

export default function KnowledgePage() {
  const { setPageTitle, setPageIcon } = useHeaderContext();
  const { fetchWithAuth } = useAuthenticatedApi();
  const { toast } = useToast();

  const [data, setData] = useState<KnowledgeState>({
    user: { name: '', role: '', preferences: '' },
    business: { name: '', industry: '', size: '', stage: '', description: '' },
    initiatives: [],
    insights: [],
    conversationCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPageTitle('Knowledge');
    setPageIcon(<Brain className="h-5 w-5" />);
    return () => {
      setPageTitle('');
      setPageIcon(undefined);
    };
  }, [setPageTitle, setPageIcon]);

  useEffect(() => {
    loadKnowledge();
  }, []);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userRes = await fetchWithAuth('/api/me');
      const userData = userRes.ok ? await userRes.json() : { data: null };

      // Fetch company data
      const companyRes = await fetchWithAuth('/api/companies/current');
      const companyData = companyRes.ok ? await companyRes.json() : { data: null };

      // Fetch brain tickets as initiatives
      const ticketsRes = await fetchWithAuth('/api/db/brain_tickets?limit=10&order=created_at.desc');
      const ticketsData = ticketsRes.ok ? await ticketsRes.json() : { data: [] };

      // Fetch thoughts as insights
      const thoughtsRes = await fetchWithAuth('/api/db/thoughts?limit=10&order=created_at.desc');
      const thoughtsData = thoughtsRes.ok ? await thoughtsRes.json() : { data: [] };

      // Fetch conversation count
      const convRes = await fetchWithAuth('/api/audit/conversations?limit=1');
      const convData = convRes.ok ? await convRes.json() : { data: { pagination: { total: 0 } } };

      const profile = userData.data || {};
      const company = companyData.data || {};

      setData({
        user: {
          name: profile.display_name || profile.name || '',
          role: profile.role || profile.job_title || '',
          preferences: profile.preferences?.communication_style || ''
        },
        business: {
          name: company.name || '',
          industry: company.industry || '',
          size: company.size || company.employee_count || '',
          stage: company.stage || '',
          description: company.description || ''
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
        conversationCount: convData.data?.pagination?.total || 0
      });
    } catch (err) {
      console.error('Failed to load knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (section: string) => {
    if (section === 'user') {
      setEditForm({ ...data.user });
    } else if (section === 'business') {
      setEditForm({ ...data.business });
    }
    setEditingSection(section);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditForm({});
  };

  const saveSection = async (section: string) => {
    setSaving(true);
    try {
      if (section === 'user') {
        // Update user profile
        const res = await fetchWithAuth('/api/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: editForm.name,
            role: editForm.role,
            preferences: { communication_style: editForm.preferences }
          })
        });

        if (res.ok) {
          setData(prev => ({ ...prev, user: { ...editForm } }));
          toast({ title: 'Profile updated', description: 'Your information has been saved.' });
        }
      } else if (section === 'business') {
        // Update company
        const res = await fetchWithAuth('/api/companies/current', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editForm.name,
            industry: editForm.industry,
            size: editForm.size,
            stage: editForm.stage,
            description: editForm.description
          })
        });

        if (res.ok) {
          setData(prev => ({ ...prev, business: { ...editForm } }));
          toast({ title: 'Business info updated', description: 'Your business information has been saved.' });
        }
      }
      setEditingSection(null);
      setEditForm({});
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save changes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const hasUserInfo = data.user.name || data.user.role;
  const hasBusinessInfo = data.business.name;
  const hasInitiatives = data.initiatives.length > 0;
  const hasInsights = data.insights.length > 0;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-500/20 rounded-full mb-4">
          <Brain className="h-8 w-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">What Nexus Knows About You</h1>
        <p className="text-slate-400 mt-2 max-w-lg mx-auto">
          This is the information Nexus uses to personalize your experience.
          Review and correct anything that's inaccurate.
        </p>
      </div>

      {/* Narrative Story */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">

        {/* About You Section */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">About You</h2>
            </div>
            {editingSection !== 'user' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('user')}
                className="h-7 px-2 text-slate-400 hover:text-slate-200"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {editingSection === 'user' ? (
            <div className="space-y-3 bg-slate-900/50 rounded-lg p-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Your Name</label>
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter your name"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Your Role</label>
                <Input
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  placeholder="e.g., Founder, CEO, Developer"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Communication Preference</label>
                <Input
                  value={editForm.preferences || ''}
                  onChange={(e) => setEditForm({ ...editForm, preferences: e.target.value })}
                  placeholder="e.g., Direct, detailed, casual"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => saveSection('user')} disabled={saving}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-slate-200 leading-relaxed">
              {hasUserInfo ? (
                <>
                  You are <span className="text-indigo-300 font-medium">{data.user.name || 'someone'}</span>
                  {data.user.role && <>, working as a <span className="text-indigo-300 font-medium">{data.user.role}</span></>}.
                  {data.user.preferences && <> You prefer <span className="text-slate-300">{data.user.preferences.toLowerCase()}</span> communication.</>}
                </>
              ) : (
                <span className="text-slate-500 italic">
                  Tell Nexus about yourself to get more personalized responses.
                </span>
              )}
            </p>
          )}
        </div>

        <hr className="border-slate-700" />

        {/* Your Business Section */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-400" />
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Your Business</h2>
            </div>
            {editingSection !== 'business' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEditing('business')}
                className="h-7 px-2 text-slate-400 hover:text-slate-200"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>

          {editingSection === 'business' ? (
            <div className="space-y-3 bg-slate-900/50 rounded-lg p-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Business Name</label>
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your company name"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Industry</label>
                  <Input
                    value={editForm.industry || ''}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                    placeholder="e.g., Technology, Healthcare"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Size</label>
                  <Input
                    value={editForm.size || ''}
                    onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                    placeholder="e.g., 1-10, 50-200"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Stage</label>
                <Input
                  value={editForm.stage || ''}
                  onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
                  placeholder="e.g., Startup, Growth, Enterprise"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Description</label>
                <Input
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="What does your business do?"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => saveSection('business')} disabled={saving}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelEditing}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-slate-200 leading-relaxed">
              {hasBusinessInfo ? (
                <>
                  You're building <span className="text-green-300 font-medium">{data.business.name}</span>
                  {data.business.industry && <>, a company in the <span className="text-slate-300">{data.business.industry}</span> space</>}
                  {data.business.size && <> with <span className="text-slate-300">{data.business.size}</span> people</>}
                  {data.business.stage && <>, currently in the <span className="text-slate-300">{data.business.stage}</span> stage</>}.
                  {data.business.description && <> {data.business.description}</>}
                </>
              ) : (
                <span className="text-slate-500 italic">
                  Add your business information so Nexus can provide relevant advice.
                </span>
              )}
            </p>
          )}
        </div>

        <hr className="border-slate-700" />

        {/* Current Focus / Initiatives */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-orange-400" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Current Focus</h2>
          </div>

          {hasInitiatives ? (
            <div className="space-y-2">
              <p className="text-slate-200 mb-3">
                You're currently working on:
              </p>
              {data.initiatives.filter(i => i.status === 'active').slice(0, 3).map((initiative) => (
                <div key={initiative.id} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">{initiative.title}</span>
                    {initiative.description && (
                      <span className="text-slate-500"> — {initiative.description.substring(0, 100)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">
              No active initiatives yet. As you chat with Nexus about your goals, they'll appear here.
            </p>
          )}
        </div>

        <hr className="border-slate-700" />

        {/* Key Insights */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">Key Insights</h2>
          </div>

          {hasInsights ? (
            <div className="space-y-2">
              <p className="text-slate-200 mb-3">
                Important things Nexus has learned:
              </p>
              {data.insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-sm font-medium text-slate-200">{insight.title}</p>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{insight.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic">
              No insights captured yet. These will be added as you use Nexus.
            </p>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
        <span>{data.conversationCount} conversations</span>
        <span>•</span>
        <span>{data.insights.length} insights</span>
        <span>•</span>
        <span>{data.initiatives.filter(i => i.status === 'active').length} active initiatives</span>
      </div>

      {/* Privacy Note */}
      <p className="text-center text-xs text-slate-500">
        This information is stored securely in your private workspace and used only to personalize your AI experience.
      </p>
    </div>
  );
}
