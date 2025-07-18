import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { Input } from '@/shared/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/shared/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/Select';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Alert, AlertDescription } from '@/shared/components/ui/Alert';
import { useAuth } from '@/domains/admin/user/hooks/AuthContext';
import { useNotifications } from '@/shared/core/hooks/NotificationContext';
import { automationTemplateImporter, type AutomationTemplate } from '@/shared/lib/automation/templateImporter';
import {
  Search,
  Filter,
  Download,
  Star,
  Clock,
  Zap,
  ExternalLink,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Sparkles,
  Code,
  GitBranch,
  Play,
  Settings,
  Eye,
  Heart,
  Share,
  Tag,
  Calendar,
  BarChart3
} from 'lucide-react';

interface TemplateMarketplaceProps {
  onTemplateSelected?: (template: AutomationTemplate) => void;
  onClose?: () => void;
}

const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'All Templates', icon: Sparkles },
  { id: 'sales', name: 'Sales', icon: TrendingUp },
  { id: 'marketing', name: 'Marketing', icon: Users },
  { id: 'finance', name: 'Finance', icon: BarChart3 },
  { id: 'operations', name: 'Operations', icon: Settings },
  { id: 'customer_success', name: 'Customer Success', icon: Heart },
  { id: 'general', name: 'General', icon: Zap }
];

const TEMPLATE_SOURCES = [
  { id: 'all', name: 'All Sources' },
  { id: 'nexus', name: 'Nexus Official' },
  { id: 'zapier', name: 'Zapier Import' },
  { id: 'make', name: 'Make.com Import' },
  { id: 'n8n', name: 'n8n Community' },
  { id: 'custom', name: 'Custom Templates' }
];

const DIFFICULTY_LEVELS = [
  { id: 'all', name: 'All Levels' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' }
];

export const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({
  onTemplateSelected,
  onClose
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'recent'>('downloads');
  
  // Import dialog state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importSource, setImportSource] = useState<'zapier' | 'make' | 'n8n' | 'custom'>('zapier');
  const [importData, setImportData] = useState('');
  const [importing, setImporting] = useState(false);
  
  // Template details dialog state
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory, selectedSource, selectedDifficulty, sortBy]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await automationTemplateImporter.getAvailableTemplates();
      setTemplates(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to load templates',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Source filter
    if (selectedSource !== 'all') {
      filtered = filtered.filter(template => template.source === selectedSource);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(template => template.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleImportTemplate = async () => {
    if (!importData.trim()) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Please provide template data'
      });
      return;
    }

    try {
      setImporting(true);
      let templateData;
      
      try {
        templateData = JSON.parse(importData);
      } catch (error) {
        throw new Error('Invalid JSON format');
      }

      const result = await automationTemplateImporter.importTemplate(
        templateData,
        importSource,
        user?.id || ''
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Template Imported',
          message: 'Template has been successfully imported and converted'
        });
        setShowImportDialog(false);
        setImportData('');
        loadTemplates();
      } else {
        throw new Error(result.errors?.join(', ') || 'Import failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeployTemplate = async (template: AutomationTemplate) => {
    try {
      setDeploying(true);
      const result = await automationTemplateImporter.deployTemplate(
        template.id,
        {},
        user?.id || ''
      );

      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Template Deployed',
          message: `${template.name} has been deployed as an active workflow`
        });
        setShowDetailsDialog(false);
        if (onTemplateSelected) {
          onTemplateSelected(template);
        }
      } else {
        throw new Error(result.errors?.join(', ') || 'Deployment failed');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Deployment Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setDeploying(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success/10 text-success dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-warning/10 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-destructive/10 text-destructive dark:bg-red-900 dark:text-red-200';
      default: return 'bg-muted text-foreground dark:bg-background dark:text-foreground';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'nexus': return 'bg-primary/10 text-primary dark:bg-blue-900 dark:text-blue-200';
      case 'zapier': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'make': return 'bg-secondary/10 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'n8n': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default: return 'bg-muted text-foreground dark:bg-background dark:text-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Automation Templates</h2>
          <p className="text-muted-foreground">
            Browse and import automation templates from various platforms
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Automation Template</DialogTitle>
                <DialogDescription>
                  Import an automation template from another platform or JSON file.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Template Source</label>
                  <Select value={importSource} onValueChange={(value: any) => setImportSource(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zapier">Zapier</SelectItem>
                      <SelectItem value="make">Make.com</SelectItem>
                      <SelectItem value="n8n">n8n</SelectItem>
                      <SelectItem value="custom">Custom JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Template Data (JSON)</label>
                  <Textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste your template JSON here..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import templates from other platforms. We'll automatically convert them to work with Nexus.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowImportDialog(false)}
                    disabled={importing}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleImportTemplate} disabled={importing}>
                    {importing ? 'Importing...' : 'Import Template'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedSource} onValueChange={setSelectedSource}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_SOURCES.map(source => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIFFICULTY_LEVELS.map(level => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="downloads">Most Downloaded</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Badge variant="secondary" className={getDifficultyColor(template.difficulty)}>
                      {template.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{template.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{template.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{template.estimatedSetupTime}m</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className={getSourceColor(template.source)}>
                      {template.source}
                    </Badge>
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowDetailsDialog(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeployTemplate(template)}
                      disabled={template.conversionStatus === 'failed'}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Deploy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTemplate.name}
                  <Badge variant="secondary" className={getSourceColor(selectedTemplate.source)}>
                    {selectedTemplate.source}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedTemplate.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.rating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.downloads}</div>
                    <div className="text-sm text-muted-foreground">Downloads</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.estimatedSetupTime}m</div>
                    <div className="text-sm text-muted-foreground">Setup Time</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{selectedTemplate.timeSavingsPerWeek}h</div>
                    <div className="text-sm text-muted-foreground">Time Saved/Week</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Required Integrations</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.requiredIntegrations.map((integration) => (
                      <Badge key={integration} variant="outline">
                        {integration}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedTemplate.conversionStatus === 'failed' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This template could not be automatically converted to Nexus format. 
                      Manual configuration may be required.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsDialog(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleDeployTemplate(selectedTemplate)}
                    disabled={deploying || selectedTemplate.conversionStatus === 'failed'}
                  >
                    {deploying ? 'Deploying...' : 'Deploy Template'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!loading && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or import a new template
          </p>
          <Button onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Template
          </Button>
        </div>
      )}
    </div>
  );
}; 