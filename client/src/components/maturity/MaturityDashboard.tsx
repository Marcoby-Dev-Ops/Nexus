import React, { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, Target, Lightbulb, BarChart3,
  Activity, Users, DollarSign, Building2, Globe, CheckCircle, AlertTriangle, Rocket
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { useMaturityFramework } from '@/hooks/useMaturityFramework';
import { MaturityRadarChart } from './MaturityRadarChart';
import { MaturityRecommendationCard } from './MaturityRecommendationCard';

// ---------- Types (align with your service) ----------
type DomainId = 'sales' | 'marketing' | 'operations' | 'finance' | 'leadership' | 'people';
type Trend = 'improving' | 'declining' | 'stable';

interface SubDimensionScore {
  id: string;
  name: string;
  score: number; // 0-5
  level: 0 | 1 | 2 | 3 | 4 | 5;
  insights: string[];
}

interface MaturityScore {
  domainId: DomainId;
  domainName: string;
  score: number; // 0-5
  level: 0 | 1 | 2 | 3 | 4 | 5;
  percentile: number; // 0-100
  trend: Trend;
  lastUpdated: string;
  subDimensionScores: SubDimensionScore[];
  recommendations: any[]; // Align with service interface
}

interface Recommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedTime: string;
  domain: string;
}

interface Profile {
  userId: string;
  companyId: string;
  overallScore: number;
  overallLevel: 0 | 1 | 2 | 3 | 4 | 5;
  domainScores: MaturityScore[];
  recommendations: Recommendation[];
  lastAssessment: string;
  nextAssessment: string;
  improvementHistory: any[];
  benchmarkData: any;
}

// ---------- Utilities ----------
const formatDaysAway = (iso: string) => {
  const diffMs = new Date(iso).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return `${days} day${days === 1 ? '' : 's'} away`;
};

const domainIcon = (domainId: DomainId) => {
  switch (domainId) {
    case 'sales': return <Users className="w-5 h-5" />;
    case 'marketing': return <Globe className="w-5 h-5" />;
    case 'operations': return <Building2 className="w-5 h-5" />;
    case 'finance': return <DollarSign className="w-5 h-5" />;
    case 'leadership': return <Target className="w-5 h-5" />;
    case 'people': return <Users className="w-5 h-5" />;
  }
};

const containerMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18 }
};

const MaturityDashboard: React.FC = () => {
  const {
    profile,
    loading,
    error,
    getOverallLevel,
    getOverallScore,
    getLevelColor,
    getLevelName,
    getPercentileText,
    getTrendIcon,
    getTrendColor,
    highPriorityRecommendations
  } = useMaturityFramework();

  const [selectedDomain, setSelectedDomain] = useState<DomainId | null>(null);

  const handleDomainClick = useCallback((d?: DomainId | null) => {
    setSelectedDomain(d ?? null);
  }, []);

  // Pre-derive values to avoid recalculating
  const overallScore = useMemo(() => Number(getOverallScore()?.toFixed(1) ?? 0), [getOverallScore]);
  const overallLevelName = useMemo(() => getOverallLevel(), [getOverallLevel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950" role="alert" aria-live="polite">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200">Error Loading Maturity Profile</h3>
                  <p className="text-red-600 dark:text-red-300">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">No Maturity Assessment Found</h2>
              <p className="text-muted-foreground mb-6">
                Complete your business maturity assessment to see your performance insights and recommendations.
              </p>
              <Button size="lg" aria-label="Start maturity assessment">
                <Rocket className="w-4 h-4 mr-2" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const typedProfile = profile as Profile;
  const selected = selectedDomain
    ? typedProfile.domainScores.find((d) => d.domainId === selectedDomain)
    : undefined;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Business Maturity Profile</h1>
            <p className="text-muted-foreground">
              Your business performance across all domains with actionable insights
            </p>
          </div>
          <Badge className={`px-3 py-1 ${getLevelColor(typedProfile.overallLevel)}`}>
            {getLevelName(typedProfile.overallLevel)} Level
          </Badge>
        </div>

        {/* Overall Score Card */}
        <motion.div {...containerMotion}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Overall Business Maturity
              </CardTitle>
              <CardDescription>
                Your business is performing at a {overallLevelName} level with room for improvement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Score */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{overallScore.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                  <Progress value={(overallScore / 5) * 100} className="mt-2" aria-label="Overall score progress" />
                </div>

                {/* Level Description */}
                <div className="text-center">
                  <div className="text-2xl font-semibold mb-2">{getLevelName(typedProfile.overallLevel)}</div>
                  <div className="text-sm text-muted-foreground">
                    {typedProfile.overallLevel >= 4 ? 'High Performance'
                      : typedProfile.overallLevel >= 3 ? 'Functional'
                      : typedProfile.overallLevel >= 2 ? 'Developing'
                      : 'Needs Attention'}
                  </div>
                </div>

                {/* Next Assessment */}
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Next Assessment</div>
                  <div className="text-lg font-semibold">
                    {new Date(typedProfile.nextAssessment).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDaysAway(typedProfile.nextAssessment)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <motion.div {...containerMotion}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Domain Performance
                </CardTitle>
                <CardDescription>Your business maturity across all domains</CardDescription>
              </CardHeader>
              <CardContent>
                <MaturityRadarChart
                  domainScores={typedProfile.domainScores}
                  onDomainClick={(id: DomainId) => handleDomainClick(id)}
                  selectedDomain={selectedDomain}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Domain Details */}
          <motion.div {...containerMotion}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Domain Insights
                </CardTitle>
                <CardDescription>
                  {selected ? `Detailed view: ${selected.domainName}` : 'Click on a domain in the chart to see details'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selected ? (
                  <DomainDetails
                    domainScore={selected}
                    getLevelColor={getLevelColor}
                    getLevelName={getLevelName}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a domain to view detailed insights</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div {...containerMotion}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Priority Recommendations
              </CardTitle>
              <CardDescription>AI-powered recommendations to improve your business maturity</CardDescription>
            </CardHeader>
            <CardContent>
              {highPriorityRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {highPriorityRecommendations.slice(0, 4).map((r: Recommendation) => (
                    <MaturityRecommendationCard key={r.id} recommendation={r} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No high-priority recommendations at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Domain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {typedProfile.domainScores.map((d) => (
            <motion.div key={d.domainId} {...containerMotion}>
              <DomainCard
                domainScore={d}
                onClick={() => handleDomainClick(d.domainId)}
                isSelected={selectedDomain === d.domainId}
                getLevelColor={getLevelColor}
                getLevelName={getLevelName}
                getPercentileText={getPercentileText}
                getTrendIcon={getTrendIcon}
                getTrendColor={getTrendColor}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface DomainCardProps {
  domainScore: MaturityScore;
  onClick: () => void;
  isSelected: boolean;
  getLevelColor: (level: MaturityScore['level']) => string;
  getLevelName: (level: MaturityScore['level']) => string;
  getPercentileText: (p: number) => string;
  getTrendIcon: (t: Trend) => string;
  getTrendColor: (t: Trend) => string;
}

const DomainCard: React.FC<DomainCardProps> = ({
  domainScore, onClick, isSelected,
  getLevelColor, getLevelName, getPercentileText, getTrendIcon, getTrendColor
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Open ${domainScore.domainName} details`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {domainIcon(domainScore.domainId)}
            <h3 className="font-semibold">{domainScore.domainName}</h3>
          </div>
          <Badge className={`px-2 py-1 text-xs ${getLevelColor(domainScore.level)}`}>
            {getLevelName(domainScore.level)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Score</span>
            <span className="font-semibold">{domainScore.score.toFixed(1)}/5</span>
          </div>
          <Progress value={(domainScore.score / 5) * 100} className="h-2" aria-label={`${domainScore.domainName} score progress`} />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{getPercentileText(domainScore.percentile)}</span>
            <span className={`flex items-center gap-1 ${getTrendColor(domainScore.trend)}`}>
              <span>{getTrendIcon(domainScore.trend)}</span>
              {domainScore.trend}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface DomainDetailsProps {
  domainScore: MaturityScore;
  getLevelColor: (level: MaturityScore['level']) => string;
  getLevelName: (level: MaturityScore['level']) => string;
}

const DomainDetails: React.FC<DomainDetailsProps> = ({ domainScore, getLevelColor, getLevelName }) => {
  return (
    <div className="space-y-4">
      {/* Domain Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{domainScore.domainName}</h3>
        <Badge className={getLevelColor(domainScore.level)}>{getLevelName(domainScore.level)}</Badge>
      </div>

      {/* Score and Percentile */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{domainScore.score.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Score</div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-2xl font-bold">{domainScore.percentile}%</div>
          <div className="text-sm text-muted-foreground">Percentile</div>
        </div>
      </div>

      {/* Sub-Dimensions */}
      <div className="space-y-3">
        <h4 className="font-semibold">Sub-Dimensions</h4>
        {domainScore.subDimensionScores.map((sub) => (
          <div key={sub.id} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{sub.name}</span>
              <Badge variant="outline" className="text-xs">{sub.score.toFixed(1)}/5</Badge>
            </div>
            <Progress value={(sub.score / 5) * 100} className="h-1 mb-2" aria-label={`${sub.name} progress`} />
            {sub.insights?.length > 0 && (
              <div className="text-xs text-muted-foreground">{sub.insights[0]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaturityDashboard;
