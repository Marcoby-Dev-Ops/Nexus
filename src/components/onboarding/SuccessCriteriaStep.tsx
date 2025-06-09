import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Label } from '../ui/Label';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Checkbox } from '../ui/Checkbox';
import { Badge } from '../ui/Badge';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  DollarSign,
  Users2,
  Zap
} from 'lucide-react';

interface SuccessCriteriaData {
  primary_success_metric: string;
  secondary_metrics: string[];
  time_savings_goal: string;
  roi_expectation: string;
  usage_frequency: string;
  success_scenarios: string[];
  failure_conditions: string[];
  measurement_method: string;
  review_frequency: string;
  stakeholder_buy_in: string[];
  immediate_wins: string[];
  long_term_vision: string;
}

interface SuccessCriteriaStepProps {
  onNext: (data: SuccessCriteriaData) => void;
  onBack: () => void;
}

export const SuccessCriteriaStep: React.FC<SuccessCriteriaStepProps> = ({ onNext, onBack }) => {
  const [criteriaData, setCriteriaData] = useState<SuccessCriteriaData>({
    primary_success_metric: '',
    secondary_metrics: [],
    time_savings_goal: '',
    roi_expectation: '',
    usage_frequency: 'daily',
    success_scenarios: [],
    failure_conditions: [],
    measurement_method: 'quantitative',
    review_frequency: 'monthly',
    stakeholder_buy_in: [],
    immediate_wins: [],
    long_term_vision: ''
  });

  const primaryMetrics = [
    'Time Savings', 'Cost Reduction', 'Revenue Increase', 'Productivity Gain',
    'Error Reduction', 'Customer Satisfaction', 'Team Efficiency', 'Data Accuracy',
    'Process Standardization', 'Compliance Improvement'
  ];

  const secondaryMetrics = [
    'Faster Decision Making', 'Improved Data Quality', 'Better Collaboration',
    'Reduced Manual Work', 'Enhanced Visibility', 'Streamlined Workflows',
    'Better Customer Experience', 'Increased Automation', 'Risk Reduction',
    'Scalability Improvement', 'Knowledge Retention', 'Process Documentation'
  ];

  const timeSavingsOptions = [
    '2-5 hours per week', '5-10 hours per week', '10-20 hours per week',
    '20+ hours per week', '1 full day per week', '2+ days per week'
  ];

  const roiExpectations = [
    'Break even within 1 month', 'Break even within 3 months', 
    'Break even within 6 months', 'Break even within 1 year',
    '2x ROI within 6 months', '3x ROI within 1 year', '5x+ ROI long-term'
  ];

  const usageFrequencies = [
    'Multiple times daily', 'Daily', 'Several times per week', 
    'Weekly', 'Monthly', 'As needed'
  ];

  const successScenarios = [
    'All team members actively using the platform',
    'Key workflows fully automated',
    'Real-time insights driving decisions',
    'Significant reduction in manual reporting',
    'Improved cross-team collaboration',
    'Faster response to business changes',
    'Proactive identification of opportunities',
    'Streamlined vendor/client communications',
    'Enhanced data-driven culture',
    'Reduced operational overhead'
  ];

  const failureConditions = [
    'Low user adoption after 3 months',
    'No measurable time savings within 6 weeks',
    'Technical integration issues persist',
    'Team resistance to new processes',
    'Data quality issues remain unresolved',
    'ROI not achieved within expected timeframe',
    'Platform complexity overwhelms team',
    'Critical workflows break or fail',
    'Security or compliance concerns arise',
    'Vendor support inadequate'
  ];

  const stakeholders = [
    'CEO/Founder', 'CTO/Technical Lead', 'Department Heads', 'Team Leads',
    'End Users', 'Finance/Budget Owner', 'IT/Security', 'Operations Manager'
  ];

  const immediateWins = [
    'Automated daily/weekly reports', 'Dashboard showing key metrics',
    'Alert system for critical issues', 'Simplified data entry process',
    'Integration with primary tool', 'Basic workflow automation',
    'Real-time status visibility', 'Reduced manual email updates',
    'Centralized information access', 'Quick-win process improvement'
  ];

  const handleArrayToggle = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handleSubmit = () => {
    // Store success criteria in localStorage for later use
    localStorage.setItem('nexus_success_criteria', JSON.stringify(criteriaData));
    onNext(criteriaData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <Target className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Define Success</h2>
        <p className="text-muted-foreground">
          Set clear expectations and success metrics to ensure Nexus delivers value
        </p>
      </div>

      <div className="grid gap-6">
        {/* Primary Success Metric */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Primary Success Metric
            </CardTitle>
            <p className="text-sm text-muted-foreground">What's the #1 way you'll measure success?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {primaryMetrics.map((metric) => (
                <Button
                  key={metric}
                  variant={criteriaData.primary_success_metric === metric ? "default" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => setCriteriaData(prev => ({ ...prev, primary_success_metric: metric }))}
                >
                  {metric}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Secondary Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Secondary Success Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">Additional benefits you expect to see</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {secondaryMetrics.map((metric) => (
                <div key={metric} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric}
                    checked={criteriaData.secondary_metrics.includes(metric)}
                    onCheckedChange={() => handleArrayToggle(
                      criteriaData.secondary_metrics, 
                      metric, 
                      (arr) => setCriteriaData(prev => ({ ...prev, secondary_metrics: arr }))
                    )}
                  />
                  <Label htmlFor={metric} className="text-sm">{metric}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time & ROI Expectations */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Savings Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={criteriaData.time_savings_goal}
                onValueChange={(value) => setCriteriaData(prev => ({ ...prev, time_savings_goal: value }))}
              >
                {timeSavingsOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                ROI Expectation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={criteriaData.roi_expectation}
                onValueChange={(value) => setCriteriaData(prev => ({ ...prev, roi_expectation: value }))}
              >
                {roiExpectations.map((expectation) => (
                  <div key={expectation} className="flex items-center space-x-2">
                    <RadioGroupItem value={expectation} id={expectation} />
                    <Label htmlFor={expectation}>{expectation}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Usage & Review Frequency */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Expected Usage Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={criteriaData.usage_frequency}
                onValueChange={(value) => setCriteriaData(prev => ({ ...prev, usage_frequency: value }))}
              >
                {usageFrequencies.map((frequency) => (
                  <div key={frequency} className="flex items-center space-x-2">
                    <RadioGroupItem value={frequency} id={frequency} />
                    <Label htmlFor={frequency}>{frequency}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success Review Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={criteriaData.review_frequency}
                onValueChange={(value) => setCriteriaData(prev => ({ ...prev, review_frequency: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly check-ins</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly reviews</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quarterly" id="quarterly" />
                  <Label htmlFor="quarterly">Quarterly assessments</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Success Scenarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Success Scenarios
            </CardTitle>
            <p className="text-sm text-muted-foreground">What does success look like?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {successScenarios.map((scenario) => (
                <div key={scenario} className="flex items-center space-x-2">
                  <Checkbox
                    id={scenario}
                    checked={criteriaData.success_scenarios.includes(scenario)}
                    onCheckedChange={() => handleArrayToggle(
                      criteriaData.success_scenarios, 
                      scenario, 
                      (arr) => setCriteriaData(prev => ({ ...prev, success_scenarios: arr }))
                    )}
                  />
                  <Label htmlFor={scenario} className="text-sm">{scenario}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Failure Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Warning Signs / Failure Conditions
            </CardTitle>
            <p className="text-sm text-muted-foreground">What would indicate the implementation isn't working?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {failureConditions.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={criteriaData.failure_conditions.includes(condition)}
                    onCheckedChange={() => handleArrayToggle(
                      criteriaData.failure_conditions, 
                      condition, 
                      (arr) => setCriteriaData(prev => ({ ...prev, failure_conditions: arr }))
                    )}
                  />
                  <Label htmlFor={condition} className="text-sm">{condition}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stakeholder Buy-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Key Stakeholders for Success
            </CardTitle>
            <p className="text-sm text-muted-foreground">Who needs to be on board for this to succeed?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {stakeholders.map((stakeholder) => (
                <div key={stakeholder} className="flex items-center space-x-2">
                  <Checkbox
                    id={stakeholder}
                    checked={criteriaData.stakeholder_buy_in.includes(stakeholder)}
                    onCheckedChange={() => handleArrayToggle(
                      criteriaData.stakeholder_buy_in, 
                      stakeholder, 
                      (arr) => setCriteriaData(prev => ({ ...prev, stakeholder_buy_in: arr }))
                    )}
                  />
                  <Label htmlFor={stakeholder} className="text-sm">{stakeholder}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Immediate Wins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Immediate Wins (First 30 Days)
            </CardTitle>
            <p className="text-sm text-muted-foreground">Quick wins to build momentum</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {immediateWins.map((win) => (
                <div key={win} className="flex items-center space-x-2">
                  <Checkbox
                    id={win}
                    checked={criteriaData.immediate_wins.includes(win)}
                    onCheckedChange={() => handleArrayToggle(
                      criteriaData.immediate_wins, 
                      win, 
                      (arr) => setCriteriaData(prev => ({ ...prev, immediate_wins: arr }))
                    )}
                  />
                  <Label htmlFor={win} className="text-sm">{win}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Long-term Vision */}
        <Card>
          <CardHeader>
            <CardTitle>Long-term Vision</CardTitle>
            <p className="text-sm text-muted-foreground">Where do you see your business intelligence and automation in 12 months?</p>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Fully automated financial reporting, predictive analytics driving strategy, team focused on high-value work rather than manual tasks..."
              value={criteriaData.long_term_vision}
              onChange={(e) => setCriteriaData(prev => ({ ...prev, long_term_vision: e.target.value }))}
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>
      </div>

      {/* Success Criteria Summary */}
      {criteriaData.primary_success_metric && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Success Criteria Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Primary Goal</Badge>
                <span>{criteriaData.primary_success_metric}</span>
              </div>
              {criteriaData.time_savings_goal && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Time Savings</Badge>
                  <span>{criteriaData.time_savings_goal}</span>
                </div>
              )}
              {criteriaData.roi_expectation && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">ROI Target</Badge>
                  <span>{criteriaData.roi_expectation}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline">Review</Badge>
                <span>{criteriaData.review_frequency} success reviews</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!criteriaData.primary_success_metric || criteriaData.success_scenarios.length === 0}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}; 