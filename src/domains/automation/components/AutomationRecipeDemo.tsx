import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { Progress } from '@/shared/components/ui/Progress';
import { 
  Play, 
  Pause, 
  Settings, 
  CheckCircle, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  Zap,
  AlertCircle,
  BarChart3,
  Mail,
  Database,
  Bot,
  Workflow
} from 'lucide-react';
import { AutomationRecipeBrowser } from '@/domains/automation/components/AutomationRecipeBrowser';
import { useAutomationRecipes } from '@/domains/automation/hooks/useAutomationRecipes';
import type { AutomationRecipe } from '@/domains/automation/automationRecipeEngine';

export interface AutomationRecipeDemoProps {
  className?: string;
}

export const AutomationRecipeDemo: React.FC<AutomationRecipeDemoProps> = ({ className = '' }) => {
  const { recipes, deployments, loading, deployRecipe, toggleDeployment } = useAutomationRecipes();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [demoStats, setDemoStats] = useState({
    totalRecipes: 0,
    deployedRecipes: 0,
    totalExecutions: 0,
    timesSaved: 0
  });

  useEffect(() => {
    // Update demo stats
    setDemoStats({
      totalRecipes: recipes.length,
      deployedRecipes: deployments.filter(d => d.status === 'active').length,
      totalExecutions: deployments.reduce((sum, d) => sum + d.executionCount, 0),
      timesSaved: deployments.length * 2.5 // Estimated hours saved per deployment
    });
  }, [recipes, deployments]);

  const categoryStats = [
    {
      category: 'sales',
      name: 'Sales',
      icon: TrendingUp,
      color: 'bg-primary',
      count: recipes.filter(r => r.category === 'sales').length,
      description: 'Lead nurturing & CRM automation'
    },
    {
      category: 'marketing',
      name: 'Marketing',
      icon: Users,
      color: 'bg-purple-500',
      count: recipes.filter(r => r.category === 'marketing').length,
      description: 'Campaign & content automation'
    },
    {
      category: 'finance',
      name: 'Finance',
      icon: BarChart3,
      color: 'bg-success',
      count: recipes.filter(r => r.category === 'finance').length,
      description: 'Invoice & payment automation'
    },
    {
      category: 'operations',
      name: 'Operations',
      icon: Settings,
      color: 'bg-warning',
      count: recipes.filter(r => r.category === 'operations').length,
      description: 'Process & workflow automation'
    },
    {
      category: 'customer_success',
      name: 'Customer Success',
      icon: Users,
      color: 'bg-primary',
      count: recipes.filter(r => r.category === 'customer_success').length,
      description: 'Support & onboarding automation'
    }
  ];

  const featuredRecipes = recipes.slice(0, 3);

  const handleQuickDeploy = async (recipe: AutomationRecipe) => {
    await deployRecipe(recipe.id, {
      // Use default customizations for demo
      company_name: 'Nexus Demo Company',
      payment_terms: '30',
      report_recipients: 'admin@nexus.com'
    });
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Automation Recipe Engine</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Deploy pre-built automation workflows to streamline your business processes. 
          Save time, reduce errors, and focus on what matters most.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Workflow className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{demoStats.totalRecipes}</p>
                <p className="text-sm text-muted-foreground">Available Recipes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">{demoStats.deployedRecipes}</p>
                <p className="text-sm text-muted-foreground">Active Automations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold">{demoStats.totalExecutions}</p>
                <p className="text-sm text-muted-foreground">Total Executions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{demoStats.timesSaved.toFixed(1)}h</p>
                <p className="text-sm text-muted-foreground">Time Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="featured" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="browse">Browse All</TabsTrigger>
          <TabsTrigger value="deployed">My Automations</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">🌟 Featured Automation Recipes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredRecipes.map((recipe) => (
                <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{recipe.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="secondary">{recipe.category}</Badge>
                            <Badge variant="outline">{recipe.difficulty}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Star className="h-3 w-3 fill-current text-warning" />
                        <span>{recipe.averageRating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription>{recipe.description}</CardDescription>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.estimatedTime}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {recipe.benefits.slice(0, 2).map((benefit, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleQuickDeploy(recipe)}
                        className="flex-1"
                        size="sm"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Quick Deploy
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> These recipes are pre-configured with demo data. 
              In production, you would customize them with your specific business requirements.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">📂 Recipe Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((category) => {
                const Icon = category.icon;
                return (
                  <Card 
                    key={category.category} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCategory(category.category)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <div className={`p-4 rounded-lg ${category.color}`}>
                          <Icon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge variant="secondary">{category.count} recipes</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {selectedCategory !== 'all' && (
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {categoryStats.find(c => c.category === selectedCategory)?.name} Recipes
              </h4>
              <AutomationRecipeBrowser 
                category={selectedCategory as any}
                onRecipeDeployed={(recipeId, deploymentId) => {
                  console.log('Recipe deployed:', { recipeId, deploymentId });
                }}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-6">
          <AutomationRecipeBrowser 
            onRecipeDeployed={(recipeId, deploymentId) => {
              console.log('Recipe deployed:', { recipeId, deploymentId });
            }}
          />
        </TabsContent>

        <TabsContent value="deployed" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">⚡ My Active Automations</h3>
            {deployments.length > 0 ? (
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <Card key={deployment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              deployment.status === 'active' ? 'bg-success' : 
                              deployment.status === 'paused' ? 'bg-warning' : 'bg-gray-500'
                            }`} />
                            <div>
                              <h4 className="font-semibold">{deployment.recipeId}</h4>
                              <p className="text-sm text-muted-foreground">
                                Deployed {new Date(deployment.deployedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Zap className="h-4 w-4" />
                              <span>{deployment.executionCount} runs</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <AlertCircle className="h-4 w-4" />
                              <span>{deployment.errorCount} errors</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleDeployment(
                              deployment.id, 
                              deployment.status === 'active' ? 'pause' : 'resume'
                            )}
                          >
                            {deployment.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </>
                            )}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No Active Automations</h4>
                  <p className="text-muted-foreground mb-4">
                    Deploy your first automation recipe to get started with workflow automation.
                  </p>
                  <Button onClick={() => setSelectedCategory('all')}>
                    Browse Recipes
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Why Use Automation Recipes?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Save Time</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Automate repetitive tasks and focus on high-value activities. 
                Each recipe can save 2-10 hours per week.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <h4 className="font-semibold">Reduce Errors</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Eliminate human error in routine processes. 
                Consistent execution every time.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                <h4 className="font-semibold">Scale Efficiently</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Handle more work without adding staff. 
                Scale your operations intelligently.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 