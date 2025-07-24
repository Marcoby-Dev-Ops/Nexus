import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Label } from '@/shared/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/RadioGroup';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { 
  Database,
  Workflow,
  Target,
  DollarSign,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/core/auth/AuthProvider';

interface BusinessContextData {
  industry: string;
  businessmodel: string;
  revenuestage: string;
  primarydepartments: string[];
  keytools: string[];
  datasources: string[];
  automationmaturity: 'none' | 'basic' | 'intermediate' | 'advanced';
  businesspriorities: string[];
  successtimeframe: string;
  budgetexpectation: string;
}

interface BusinessContextStepProps {
  onNext: (data: BusinessContextData) => void;
  onBack: () => void;
  enrichedData?: {
    description?: string;
    industry?: string;
  };
}

export const BusinessContextStep: React.FC<BusinessContextStepProps> = ({ onNext, onBack, enrichedData }) => {
  const { user, updateCompany } = useAuth();
  const [businessData, setBusinessData] = useState<BusinessContextData>({
    industry: '',
    businessmodel: '',
    revenuestage: '',
    primarydepartments: [],
    keytools: [],
    datasources: [],
    automationmaturity: 'basic',
    businesspriorities: [],
    successtimeframe: '3-months',
    budgetexpectation: 'moderate'
  });

  // Pre-fill industry from enriched data
  React.useEffect(() => {
    if (enrichedData?.industry && !businessData.industry) {
      // Find the closest match in our predefined list
      const matchedIndustry = priorities.find(p => enrichedData.industry?.includes(p));
      if (matchedIndustry) {
        setBusinessData(prev => ({ ...prev, industry: matchedIndustry }));
      }
    }
  }, [enrichedData, businessData.industry]);

  const businessModels = [
    'B2B SaaS', 'B2C E-commerce', 'Marketplace', 'Service-based',
    'Product-based', 'Consulting', 'Subscription', 'Freemium', 'Enterprise Sales'
  ];

  const revenueStages = [
    'Pre-revenue', '$0-$100K ARR', '$100K-$1M ARR', '$1M-$10M ARR', 
    '$10M-$50M ARR', '$50M+ ARR'
  ];

  const departments = [
    'Sales', 'Marketing', 'Customer Success', 'Finance', 'Operations',
    'Engineering', 'Product', 'HR', 'Legal', 'Support'
  ];

  const tools = [
    'CRM (Salesforce, HubSpot)', 'Email Marketing (Mailchimp, Klaviyo)', 
    'Analytics (Google Analytics)', 'Project Management (Asana, Monday)',
    'Accounting (QuickBooks, Xero)', 'Support (Zendesk, Intercom)',
    'Communication (Slack, Teams)', 'Design (Figma, Canva)', 
    'Development (GitHub, Jira)', 'Social Media (Hootsuite, Buffer)'
  ];

  const dataSources = [
    'Website Analytics', 'Sales CRM', 'Email Marketing', 'Social Media',
    'Financial Systems', 'Customer Support', 'Inventory Management',
    'Survey/Feedback', 'Market Research', 'Competitor Intelligence'
  ];

  const priorities = [
    'Increase Revenue', 'Reduce Costs', 'Improve Efficiency', 'Better Customer Experience',
    'Data-Driven Decisions', 'Scale Operations', 'Improve Team Productivity',
    'Risk Management', 'Compliance', 'Innovation'
  ];

  const handleArrayToggle = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  const handleSubmit = async () => {
    // Update company information with business context
    try {
      if (user?.company_id) {
        await updateCompany({
          settings: {
            businessmodel: businessData.business_model,
            revenuestage: businessData.revenue_stage,
            automationmaturity: businessData.automation_maturity,
            primarydepartments: businessData.primary_departments,
            keytools: businessData.key_tools,
            datasources: businessData.data_sources,
            businesspriorities: businessData.business_priorities,
            successtimeframe: businessData.success_timeframe,
            budgetexpectation: businessData.budget_expectation
          }
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    // eslint-disable-next-line no-console
    console.error('Error updating business context: ', error);
    }
    
    onNext(businessData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <Workflow className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-2xl font-bold">Business Operations</h2>
        <p className="text-muted-foreground">
          Tell us about your tools, processes, and business priorities
        </p>
      </div>

      {enrichedData && (Object.keys(enrichedData).length > 0) && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Here's what we found...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {enrichedData.description && (
              <div>
                <Label>Company Description</Label>
                <p className="text-sm text-muted-foreground italic">"{enrichedData.description}"</p>
              </div>
            )}
            {enrichedData.industry && (
              <div>
                <Label>Suggested Industry</Label>
                <p className="text-sm text-muted-foreground">{enrichedData.industry}</p>
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-2">
              Is this information correct? You can adjust the fields below.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Business Model & Revenue */}
        <div className="grid md: grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Business Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={businessData.business_model}
                onValueChange={(value: string) => setBusinessData(prev => ({ ...prev, businessmodel: value }))}
              >
                {businessModels.map((model) => (
                  <div key={model} className="flex items-center space-x-2">
                    <RadioGroupItem value={model} id={model} />
                    <Label htmlFor={model}>{model}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={businessData.revenue_stage}
                onValueChange={(value: string) => setBusinessData(prev => ({ ...prev, revenuestage: value }))}
              >
                {revenueStages.map((stage) => (
                  <div key={stage} className="flex items-center space-x-2">
                    <RadioGroupItem value={stage} id={stage} />
                    <Label htmlFor={stage}>{stage}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Primary Departments */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Departments/Functions</CardTitle>
            <p className="text-sm text-muted-foreground">Which departments will use Nexus most?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md: grid-cols-5 gap-2">
              {departments.map((dept) => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox
                    id={dept}
                    checked={businessData.primary_departments.includes(dept)}
                    onCheckedChange={() => handleArrayToggle(
                      businessData.primary_departments, 
                      dept, 
                      (arr) => setBusinessData(prev => ({ ...prev, primarydepartments: arr }))
                    )}
                  />
                  <Label htmlFor={dept} className="text-sm">{dept}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Current Tools & Systems
            </CardTitle>
            <p className="text-sm text-muted-foreground">What tools are you currently using?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md: grid-cols-2 gap-2">
              {tools.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <Checkbox
                    id={tool}
                    checked={businessData.key_tools.includes(tool)}
                    onCheckedChange={() => handleArrayToggle(
                      businessData.key_tools, 
                      tool, 
                      (arr) => setBusinessData(prev => ({ ...prev, keytools: arr }))
                    )}
                  />
                  <Label htmlFor={tool} className="text-sm">{tool}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Key Data Sources
            </CardTitle>
            <p className="text-sm text-muted-foreground">What data do you want to analyze and automate?</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md: grid-cols-3 gap-2">
              {dataSources.map((source) => (
                <div key={source} className="flex items-center space-x-2">
                  <Checkbox
                    id={source}
                    checked={businessData.data_sources.includes(source)}
                    onCheckedChange={() => handleArrayToggle(
                      businessData.data_sources, 
                      source, 
                      (arr) => setBusinessData(prev => ({ ...prev, datasources: arr }))
                    )}
                  />
                  <Label htmlFor={source} className="text-sm">{source}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Business Priorities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Business Priorities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md: grid-cols-3 gap-2">
              {priorities.map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={priority}
                    checked={businessData.business_priorities.includes(priority)}
                    onCheckedChange={() => handleArrayToggle(
                      businessData.business_priorities, 
                      priority, 
                      (arr) => setBusinessData(prev => ({ ...prev, businesspriorities: arr }))
                    )}
                  />
                  <Label htmlFor={priority} className="text-sm">{priority}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automation Experience */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Experience</CardTitle>
            <p className="text-sm text-muted-foreground">Current automation maturity</p>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={businessData.automation_maturity}
              onValueChange={(value: string) => setBusinessData(prev => ({ 
                ...prev, 
                automationmaturity: value as 'none' | 'basic' | 'intermediate' | 'advanced' 
              }))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none">No automation currently</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="basic" id="basic" />
                <Label htmlFor="basic">Basic (email automation)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="intermediate" id="intermediate" />
                <Label htmlFor="intermediate">Intermediate (some workflows)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="advanced" id="advanced" />
                <Label htmlFor="advanced">Advanced (complex automation)</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleSubmit}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}; 