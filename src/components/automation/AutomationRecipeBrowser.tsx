import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Separator } from '@/components/ui/Separator';
import { toast } from '@/components/ui/Toast';
import { Search, Filter, Clock, Users, Star, Play, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { automationRecipeEngine, AutomationRecipe } from '@/lib/automation/recipes/automationRecipeEngine';
import { useAuth } from '@/hooks/useAuth';

export interface AutomationRecipeBrowserProps {
  onRecipeDeployed?: (recipeId: string, deploymentId: string) => void;
  showDeployedOnly?: boolean;
  category?: 'sales' | 'marketing' | 'finance' | 'operations' | 'customer_success';
  className?: string;
}

export const AutomationRecipeBrowser: React.FC<AutomationRecipeBrowserProps> = ({
  onRecipeDeployed,
  showDeployedOnly = false,
  category,
  className = ''
}) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<AutomationRecipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<AutomationRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<AutomationRecipe | null>(null);
  const [deploymentDialog, setDeploymentDialog] = useState(false);
  const [customizations, setCustomizations] = useState<Record<string, unknown>>({});
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchTerm, selectedCategory, selectedDifficulty]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const loadedRecipes = await automationRecipeEngine.getAvailableRecipes();
      setRecipes(loadedRecipes);
    } catch (error) {
      console.error('Failed to load recipes:', error);
      toast({
        title: 'Error Loading Recipes',
        description: 'Failed to load automation recipes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
    }

    setFilteredRecipes(filtered);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success';
      case 'medium': return 'bg-warning/10 text-yellow-800';
      case 'hard': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-primary/10 text-primary';
      case 'marketing': return 'bg-secondary/10 text-purple-800';
      case 'finance': return 'bg-success/10 text-success';
      case 'operations': return 'bg-orange-100 text-orange-800';
      case 'customer_success': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-muted text-foreground';
    }
  };

  const handleDeployRecipe = async (recipe: AutomationRecipe) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to deploy automation recipes.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedRecipe(recipe);
    
    // Initialize customizations with default values
    const defaultCustomizations: Record<string, unknown> = {};
    recipe.customizationOptions.forEach(option => {
      if (option.defaultValue !== undefined) {
        defaultCustomizations[option.id] = option.defaultValue;
      }
    });
    setCustomizations(defaultCustomizations);
    
    setDeploymentDialog(true);
  };

  const confirmDeployment = async () => {
    if (!selectedRecipe || !user) return;

    try {
      setDeploying(true);
      const result = await automationRecipeEngine.deployRecipe(
        selectedRecipe.id,
        customizations,
        user.id
      );

      if (result.success) {
        toast({
          title: 'Recipe Deployed Successfully',
          description: `${selectedRecipe.name} has been deployed and is now active.`,
          variant: 'default'
        });

        onRecipeDeployed?.(selectedRecipe.id, result.deploymentId!);
        setDeploymentDialog(false);
        setSelectedRecipe(null);
        setCustomizations({});
      } else {
        toast({
          title: 'Deployment Failed',
          description: result.error || 'Failed to deploy recipe.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        title: 'Deployment Error',
        description: 'An unexpected error occurred during deployment.',
        variant: 'destructive'
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleCustomizationChange = (optionId: string, value: unknown) => {
    setCustomizations(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  const renderCustomizationField = (option: any) => {
    const value = customizations[option.id];

    switch (option.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Input
            type={option.type}
            value={value as string || ''}
            onChange={(e) => handleCustomizationChange(option.id, e.target.value)}
            placeholder={option.placeholder}
            required={option.required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value as number || ''}
            onChange={(e) => handleCustomizationChange(option.id, Number(e.target.value))}
            placeholder={option.placeholder}
            required={option.required}
          />
        );
      case 'select':
        return (
          <Select
            value={value as string || ''}
            onValueChange={(newValue) => handleCustomizationChange(option.id, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${option.name}`} />
            </SelectTrigger>
            <SelectContent>
              {option.options?.map((optionValue: string) => (
                <SelectItem key={optionValue} value={optionValue}>
                  {optionValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'boolean':
        return (
          <Checkbox
            checked={value as boolean || false}
            onCheckedChange={(checked) => handleCustomizationChange(option.id, checked)}
          />
        );
      default:
        return (
          <Input
            value={value as string || ''}
            onChange={(e) => handleCustomizationChange(option.id, e.target.value)}
            placeholder={option.placeholder}
            required={option.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading automation recipes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automation Recipe Library</h2>
          <p className="text-muted-foreground">
            Deploy pre-built automation workflows to streamline your business processes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="sales">Sales</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="operations">Operations</SelectItem>
            <SelectItem value="customer_success">Customer Success</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <Card key={recipe.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{recipe.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{recipe.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getCategoryColor(recipe.category)}>
                        {recipe.category.replace('_', ' ')}
                      </Badge>
                      <Badge className={getDifficultyColor(recipe.difficulty)}>
                        {recipe.difficulty}
                      </Badge>
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
              <CardDescription className="text-sm">
                {recipe.description}
              </CardDescription>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.estimatedTime}</span>
                  <Users className="h-4 w-4 ml-2" />
                  <span>{recipe.usageCount} users</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{recipe.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => handleDeployRecipe(recipe)}
                  className="w-full"
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Deploy Recipe
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deployment Dialog */}
      <Dialog open={deploymentDialog} onOpenChange={setDeploymentDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-2xl">{selectedRecipe?.icon}</span>
              <span>Deploy {selectedRecipe?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Configure your automation recipe settings before deployment.
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="configure">Configure</TabsTrigger>
                <TabsTrigger value="deploy">Deploy</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedRecipe.description}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Benefits</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Prerequisites</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.prerequisites.map((prerequisite, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span>{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Success Metrics</h4>
                    <ul className="space-y-1">
                      {selectedRecipe.successMetrics.map((metric, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <Star className="h-4 w-4 text-warning" />
                          <span>{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="configure" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Customization Options</h4>
                    {selectedRecipe.customizationOptions.length > 0 ? (
                      <div className="space-y-4">
                        {selectedRecipe.customizationOptions.map((option) => (
                          <div key={option.id} className="space-y-2">
                            <Label htmlFor={option.id} className="text-sm font-medium">
                              {option.name}
                              {option.required && <span className="text-destructive"> *</span>}
                            </Label>
                            <div className="space-y-1">
                              {renderCustomizationField(option)}
                              {option.description && (
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        This recipe doesn't require any customization.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="deploy" className="space-y-4">
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ready to Deploy</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your automation recipe is configured and ready for deployment. 
                      This will create a new n8n workflow and make it active.
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Configuration validated</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setDeploymentDialog(false)}
                      disabled={deploying}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={confirmDeployment}
                      disabled={deploying}
                      className="min-w-[100px]"
                    >
                      {deploying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Deploying...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Deploy Recipe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 