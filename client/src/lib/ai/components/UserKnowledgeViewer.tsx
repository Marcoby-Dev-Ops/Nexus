import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/hooks/index';
import { Brain, RefreshCw, Download, Shield, Info, Building2 } from 'lucide-react';

/**
 * UserKnowledgeViewer
 * -------------------
 * This component shows knowledge scoped to the currently authenticated user.
 * It intentionally focuses on per-user profile, activity, memory and integrations.
 *
 * NOTE: Company- or organization-scoped knowledge (aggregated across multiple
 * users) should live in a separate component (for example `CompanyKnowledgeViewer`)
 * that aggregates and displays multi-user/company-level insights. Keeping these
 * concerns separate avoids accidental data-model or permission mismatches.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Badge } from '@/shared/components/ui/Badge';

// Minimal types describing the subset of knowledge displayed here.
interface BasicProfile { display_name?: string }
interface CompanyContext { name?: string; industry?: string; size?: string | number }
interface ActivityPatterns { session_data?: Record<string, any>; feature_usage?: string[]; productivity_metrics?: Record<string, any> }
interface AIInsights { thoughts_captured?: number; interactions_count?: number }
interface Integrations { connected_services: any[]; data_sources: string[] }
interface MemoryBank { personal_thoughts: any[]; business_observations: any[]; conversation_history: any[] }

interface UserKnowledge {
  profile: { basic: BasicProfile; completeness?: number };
  business_context: { company: CompanyContext; goals?: Record<string, any>; challenges?: string[] };
  activity_patterns: ActivityPatterns;
  ai_insights: AIInsights;
  integrations: Integrations;
  memory_bank: MemoryBank;
}

interface Props { className?: string }

const UserKnowledgeViewer: React.FC<Props> = ({ className = '' }) => {
  const auth = useAuth();
  const user = auth.user ?? null;
  const [knowledge, setKnowledge] = useState<UserKnowledge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchPlaceholderKnowledge = useCallback(async (): Promise<UserKnowledge> => ({
    profile: { basic: { display_name: ((user as any)?.name || (user as any)?.display_name) || 'You' }, completeness: 0 },
    business_context: { company: { name: '', industry: '', size: '' }, goals: {}, challenges: [] },
    activity_patterns: { session_data: {}, feature_usage: [], productivity_metrics: {} },
    ai_insights: { thoughts_captured: 0, interactions_count: 0 },
    integrations: { connected_services: [], data_sources: [] },
    memory_bank: { personal_thoughts: [], business_observations: [], conversation_history: [] }
  }), [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlaceholderKnowledge();
      setKnowledge(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load knowledge', err);
      setKnowledge(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPlaceholderKnowledge]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const onExport = () => {
    if (!knowledge) return;
    const blob = new Blob([JSON.stringify(knowledge, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-knowledge-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading your knowledge profile...</span>
      </div>
    </div>
  );

  if (!knowledge) return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>Unable to load your knowledge profile.</AlertDescription>
    </Alert>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-4">
            <Brain className="h-8 w-8 text-primary" />
            What Nexus Knows About You
          </h1>
          <p className="text-muted-foreground mt-2">Overview of contextual information that personalizes your AI experience.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Tabs defaultValue="overview">
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Intelligence
                </CardTitle>
              </div>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="memory">Memory</TabsTrigger>
                <TabsTrigger value="integrations">Integrations</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </CardHeader>
        <CardContent>
          <TabsContent value="overview">
            <pre className="text-xs">{JSON.stringify(knowledge, null, 2)}</pre>
          </TabsContent>

          <TabsContent value="profile">
            {/* Profile tab: basic + professional */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Display name</span>
                    <span className="text-sm font-medium">{knowledge.profile.basic.display_name || 'Not provided'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* minimal professional section - professional details may be absent in placeholder */}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <span className="text-sm font-medium">{(knowledge as any).profile?.professional?.role || 'Not provided'}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {((knowledge as any).profile?.professional?.skills || []).map((s: string, i: number) => (
                        <Badge key={i} variant="secondary">{s}</Badge>
                      ))}
                      {(((knowledge as any).profile?.professional?.skills || []).length === 0) && (
                        <div className="text-sm text-muted-foreground">No skills listed</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Empty placeholders for the other tabs (added scaffolding) */}
          <TabsContent value="business">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{knowledge.business_context.company.name || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Industry</span>
                    <span className="text-sm font-medium">{knowledge.business_context.company.industry || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Company Size</span>
                    <span className="text-sm font-medium">{knowledge.business_context.company.size || 'Not specified'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Goals & Challenges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Current Goals</h4>
                    <p className="text-sm">{(knowledge.business_context.goals as any)?.immediate_goals || 'Not defined'}</p>
                  </div>

                  {knowledge.business_context.challenges && knowledge.business_context.challenges.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Known Challenges</h4>
                      <ul className="list-disc pl-5">
                        {knowledge.business_context.challenges.map((c, i) => (
                          <li key={i} className="text-sm">{c}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No challenges recorded</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="activity"><div className="text-sm text-muted-foreground">Activity tab placeholder</div></TabsContent>
          <TabsContent value="memory"><div className="text-sm text-muted-foreground">Memory tab placeholder</div></TabsContent>
          <TabsContent value="integrations"><div className="text-sm text-muted-foreground">Integrations tab placeholder</div></TabsContent>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>This information is stored securely and used only to personalize your Nexus experience.</AlertDescription>
      </Alert>
    </div>
  );
};

export default UserKnowledgeViewer;
