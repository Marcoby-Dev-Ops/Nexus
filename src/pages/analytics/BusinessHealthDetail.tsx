import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { 
  ArrowLeft,
  Clock,
  AlertCircle,
  ExternalLink,
  Info,
  CheckCircle,
  DollarSign,
  BarChart,
  LifeBuoy,
  Gauge,
  Megaphone,
  Settings
} from 'lucide-react';
import { 
  businessHealthKPIs, 
  healthCategories, 
  getKPIsByCategory,
  getCategoryById,
  type KPI,
  type CategoryDefinition
} from '@/lib/businessHealthKPIs';
import { BusinessHealthScore } from '@/components/dashboard/BusinessHealthScore';

interface BusinessHealthData {
  kpiValues: Record<string, number | string | boolean>;
  categoryScores: Record<string, number>;
  overallScore: number;
  lastUpdated: string;
}

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

// Helper to get icon component by name
const getIconByName = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'DollarSign': <DollarSign />,
    'BarChart': <BarChart />,
    'LifeBuoy': <LifeBuoy />,
    'Gauge': <Gauge />,
    'Megaphone': <Megaphone />,
    'Settings': <Settings />
  };
  
  return iconMap[iconName] || <Info />;
};

const BusinessHealthDetail: React.FC = () => {
  const { categoryId } = useParams<{ categoryId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<BusinessHealthData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDefinition | null>(null);
  
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        
        // In a real app, you would fetch data from your backend/API
        // For now, we'll simulate with a delay and mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Calculate scores based on mock KPI values
        const mockCategoryScores: Record<string, number> = {};
        let totalScore = 0;
        
        healthCategories.forEach(category => {
          const categoryKPIs = getKPIsByCategory(category.id);
          let categoryScore = 0;
          let totalWeight = 0;
          
          categoryKPIs.forEach(kpi => {
            if (MOCK_KPI_VALUES[kpi.id] !== undefined) {
              // Simple score calculation for demo purposes
              const value = MOCK_KPI_VALUES[kpi.id];
              let score = 0;
              
              if (typeof value === 'boolean') {
                score = value ? 100 : 0;
              } else if (typeof value === 'string') {
                // For selection type KPIs
                const options = kpi.options || [];
                const index = options.indexOf(value);
                score = index >= 0 ? (index / (options.length - 1)) * 100 : 0;
              } else {
                // Numeric KPIs
                if (kpi.thresholds) {
                  const { poor, fair, good, excellent } = kpi.thresholds;
                  
                  // Handle inverse metrics (where lower is better)
                  const isInverse = poor > excellent;
                  
                  if (isInverse) {
                    if (value <= excellent) score = 100;
                    else if (value <= good) score = 80;
                    else if (value <= fair) score = 60;
                    else if (value <= poor) score = 40;
                    else score = 20;
                  } else {
                    // Regular metrics (higher is better)
                    if (value >= excellent) score = 100;
                    else if (value >= good) score = 80;
                    else if (value >= fair) score = 60;
                    else if (value >= poor) score = 40;
                    else score = 20;
                  }
                }
              }
              
              categoryScore += score * kpi.weight;
              totalWeight += kpi.weight;
            }
          });
          
          const finalCategoryScore = Math.round(totalWeight > 0 ? categoryScore / totalWeight : 0);
          mockCategoryScores[category.id] = finalCategoryScore;
          totalScore += finalCategoryScore * category.weight;
        });
        
        const overallScore = Math.round(totalScore / healthCategories.reduce((sum, cat) => sum + cat.weight, 0));
        
        setHealthData({
          kpiValues: MOCK_KPI_VALUES,
          categoryScores: mockCategoryScores,
          overallScore,
          lastUpdated: new Date().toISOString()
        });
        
        // If a category is specified in the URL, set it as selected
        if (categoryId) {
          const category = getCategoryById(categoryId);
          if (category) {
            setSelectedCategory(category);
          } else {
            navigate('/analytics/business-health');
          }
        }
      } catch (err) {
        console.error("Error fetching business health data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        showToast({
          title: "Error",
          description: "Failed to load business health data",
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHealthData();
  }, [categoryId, navigate, showToast]);
  
  // Helper to get color class based on score
  const getScoreColorClass = (score: number): string => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  // Helper to get background color class based on score
  const getScoreBgClass = (score: number): string => {
    if (score >= 80) return "bg-emerald-50";
    if (score >= 60) return "bg-amber-50";
    return "bg-destructive/5";
  };
  
  // Format KPI value with appropriate unit
  const formatKPIValue = (kpi: KPI, value: number | string | boolean): string => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    // For numeric values
    if (kpi.unit === '$') {
      return `$${value.toLocaleString()}`;
    }
    
    if (kpi.unit === '%') {
      return `${value}%`;
    }
    
    return `${value}${kpi.unit ? ' ' + kpi.unit : ''}`;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            Error Loading Business Health Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            variant="outline" 
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // If viewing a specific category
  if (selectedCategory && healthData) {
    const categoryKPIs = getKPIsByCategory(selectedCategory.id);
    const categoryScore = healthData.categoryScores[selectedCategory.id] || 0;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/analytics/business-health')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Health Overview
            </Button>
            <h1 className="text-2xl font-bold flex items-center">
              {getIconByName(selectedCategory.icon)}
              <span className="ml-2">{selectedCategory.name} Health</span>
            </h1>
            <p className="text-muted-foreground">{selectedCategory.description}</p>
          </div>
          <div className={`px-6 py-4 rounded-lg ${getScoreBgClass(categoryScore)}`}>
            <div className="text-center">
              <span className="text-sm font-medium text-gray-500">Score</span>
              <div className={`text-4xl font-bold ${getScoreColorClass(categoryScore)}`}>
                {categoryScore}
              </div>
            </div>
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryKPIs.map(kpi => {
            const kpiValue = healthData.kpiValues[kpi.id];
            // Skip KPIs without values
            if (kpiValue === undefined) return null;
            
            // Calculate a simple score for the KPI
            let score = 0;
            if (typeof kpiValue === 'boolean') {
              score = kpiValue ? 100 : 0;
            } else if (typeof kpiValue === 'string' && kpi.options) {
              const index = kpi.options.indexOf(kpiValue);
              score = index >= 0 ? (index / (kpi.options.length - 1)) * 100 : 0;
            } else if (typeof kpiValue === 'number' && kpi.thresholds) {
              const { poor, fair, good, excellent } = kpi.thresholds;
              const isInverse = poor > excellent;
              
              if (isInverse) {
                if (kpiValue <= excellent) score = 100;
                else if (kpiValue <= good) score = 80;
                else if (kpiValue <= fair) score = 60;
                else if (kpiValue <= poor) score = 40;
                else score = 20;
              } else {
                if (kpiValue >= excellent) score = 100;
                else if (kpiValue >= good) score = 80;
                else if (kpiValue >= fair) score = 60;
                else if (kpiValue >= poor) score = 40;
                else score = 20;
              }
            }
            
            return (
              <Card key={kpi.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{kpi.name}</CardTitle>
                  <CardDescription>{kpi.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-semibold">
                        {formatKPIValue(kpi, kpiValue)}
                      </span>
                      
                      <div className={`px-2 py-1 rounded ${getScoreBgClass(score)}`}>
                        <span className={`text-sm font-medium ${getScoreColorClass(score)}`}>
                          {score}/100
                        </span>
                      </div>
                    </div>
                    
                    {typeof kpiValue === 'number' && kpi.thresholds && (
                      <>
                        <Progress value={score} className="h-2" />
                        <div className="grid grid-cols-4 text-xs text-gray-500">
                          <div>Poor</div>
                          <div>Fair</div>
                          <div>Good</div>
                          <div className="text-right">Excellent</div>
                        </div>
                      </>
                    )}
                    
                    {kpi.actionTask && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <Button variant="outline" size="sm" className="w-full">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {kpi.actionTask}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Improvement Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Set up automated tracking for key {selectedCategory.name.toLowerCase()} metrics</span>
              </li>
              <li className="flex items-start">
                <Info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Review your {selectedCategory.name.toLowerCase()} processes quarterly</span>
              </li>
              <li className="flex items-start">
                <Info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                <span>Implement industry best practices for {selectedCategory.name.toLowerCase()}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Overview of all health categories
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Business Health</h1>
        <p className="text-muted-foreground">Comprehensive overview of your business health</p>
      </div>

      {healthData && (
        <Tabs defaultValue="score" className="space-y-6">
          <TabsList>
            <TabsTrigger value="score">What's my score?</TabsTrigger>
            <TabsTrigger value="why">Why is that my score?</TabsTrigger>
            <TabsTrigger value="improve">What can I do to improve?</TabsTrigger>
          </TabsList>

          <TabsContent value="score">
            <BusinessHealthScore />
          </TabsContent>

          <TabsContent value="why">
            <h2 className="text-xl font-semibold mt-8 mb-4">Health Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {healthCategories.map(category => {
                const score = healthData.categoryScores[category.id] || 0;
                return (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/analytics/business-health/${category.id}`)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                          {getIconByName(category.icon)}
                          <span className="ml-2">{category.name}</span>
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-3xl font-bold ${getScoreColorClass(score)}`}>
                          {score}
                        </span>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Updated today
                        </div>
                      </div>
                      <Progress value={score} className="h-2 mb-2" />
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                        {category.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="improve">
            <Card>
              <CardHeader>
                <CardTitle>Improvement Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Set up automated tracking for key metrics</span>
                  </li>
                  <li className="flex items-start">
                    <Info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Review your processes quarterly</span>
                  </li>
                  <li className="flex items-start">
                    <Info className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Implement industry best practices</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Complete your assessment</h3>
                    <Progress value={80} className="h-2" />
                    <p className="text-sm text-gray-500">80% complete - 6 more questions to answer</p>
                    <Button variant="outline" size="sm">
                      Continue Assessment
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Connect data sources</h3>
                    <Progress value={40} className="h-2" />
                    <p className="text-sm text-gray-500">3 of 7 data sources connected</p>
                    <Button variant="outline" size="sm">
                      Connect Sources
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BusinessHealthDetail; 