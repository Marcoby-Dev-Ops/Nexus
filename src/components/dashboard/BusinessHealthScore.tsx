import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PieChart, ArrowRight, Info, TrendingUp, CheckCircle } from 'lucide-react';
import { 
  healthCategories, 
  calculateOverallHealthScore
} from '@/lib/businessHealthKPIs';
import type { CategoryDefinition } from '@/lib/businessHealthKPIs';

// Mock data for demonstration
const MOCK_KPI_VALUES: Record<string, number | string | boolean> = {
  // Sales
  mrr_arr: 35000,
  new_leads: 45,
  conversion_rate: 15,
  pipeline_value: 125000,
  cac: 350,
  
  // Finance
  working_capital: 85000,
  monthly_expenses: 25000,
  profit_margin: 18,
  cash_runway: 9,
  ar_aging: 12,
  
  // Support
  first_contact_resolution: 75,
  time_to_resolution: 12,
  csat: 8.5,
  ticket_volume: 250,
  nps: 55,
  
  // Maturity
  employee_headcount: 18,
  sop_coverage: 'Most',
  key_employee_tenure: 2.5,
  strategic_planning: 'Quarterly',
  compliance_status: true,
  
  // Marketing
  website_visitors: 12000,
  mqls: 35,
  email_open_rate: 22,
  social_engagement: 2.8,
  campaign_roi: 250,
  
  // Operations
  asset_utilization: 78,
  service_uptime: 99.5,
  automation_coverage: 45,
  on_time_completion: 82,
  vendor_performance: 'Good'
};

export const BusinessHealthScore: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [score, setScore] = useState(0);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [topCategories, setTopCategories] = useState<CategoryDefinition[]>([]);

  useEffect(() => {
    const fetchBusinessHealthScore = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch from the API
        // For now, simulate with a delay and our mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Calculate scores from our KPI values
        const { overallScore, categoryScores } = calculateOverallHealthScore(MOCK_KPI_VALUES);
        
        setScore(overallScore);
        setCategoryScores(categoryScores);
        setLastUpdated(new Date().toISOString());
        
        // Get top 3 categories by score (for display)
        const sortedCategories = [...healthCategories].sort((a, b) => 
          (categoryScores[b.id] || 0) - (categoryScores[a.id] || 0)
        );
        
        setTopCategories(sortedCategories.slice(0, 3));
      } catch (err) {
        console.error('Error fetching business health score:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        showToast({
          title: 'Error',
          description: 'Failed to load business health score',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessHealthScore();
  }, [showToast]);

  // Helper to get color class based on score
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  // Helper to get background color class based on score
  const getScoreBgClass = (score: number): string => {
    if (score >= 80) return "bg-emerald-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-red-50";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Health</CardTitle>
          <CardDescription>Loading your business health assessment...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Health</CardTitle>
          <CardDescription>There was a problem loading your business health data.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Business Health</span>
          <div className={`px-3 py-1 rounded ${getScoreBgClass(score)}`}>
            <span className={`text-sm font-bold ${getScoreColorClass(score)}`}>
              {score}/100
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Overall assessment of your business key performance indicators
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Score */}
        <div className="flex items-center space-x-6">
          <div className={`text-5xl font-bold ${getScoreColorClass(score)}`}>
            {score}
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">Last updated</div>
            <div>{new Date(lastUpdated).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3 mt-6">
          {(showAllCategories ? healthCategories : topCategories).map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => navigate(`/${category.id}`)}
              className="space-y-1 w-full text-left focus:outline-none hover:bg-muted/40 rounded-sm p-1"
            >
              <div className="flex justify-between text-sm">
                <span className="font-medium">{category.name}</span>
                <span className={getScoreColorClass(categoryScores[category.id] || 0)}>
                  {categoryScores[category.id] || 0}%
                </span>
              </div>
              <Progress value={categoryScores[category.id] || 0} className="h-2" />
            </button>
          ))}
          
          {!showAllCategories && healthCategories.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 w-full text-xs"
              onClick={() => setShowAllCategories(true)}
            >
              Show All Categories
            </Button>
          )}
          
          {showAllCategories && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 w-full text-xs"
              onClick={() => setShowAllCategories(false)}
            >
              Show Less
            </Button>
          )}
        </div>

        {/* Recent Improvements */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Recent Improvements</h3>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
              <span>Maturity score increased by 15%</span>
            </div>
            <div className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
              <span>Finance health improved to 78%</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/analytics/business-health')}
        >
          View Detailed Analysis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}; 