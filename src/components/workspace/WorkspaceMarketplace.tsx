import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { 
  Search, 
  Star, 
  Download, 
  Share, 
  Heart,
  Eye,
  Filter,
  Grid,
  List,
  TrendingUp,
  Clock,
  Users,
  Award,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Sparkles,
  Crown,
  Zap,
  Target,
  Briefcase,
  Code,
  PieChart,
  MessageSquare,
  Shield,
  Palette,
  Layout,
  Import,
  BookOpen,
  ThumbsUp,
  MessageCircle,
  Flag
} from 'lucide-react';
import { workspaceComponentRegistry, type WorkspaceLayout, type WorkspaceTemplate } from '@/lib/services/workspaceComponentRegistry';
import { WORKSPACE_TEMPLATES, getTemplateRecommendations } from '@/lib/services/workspaceTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MarketplaceWorkspace extends WorkspaceLayout {
  downloads: number;
  rating: number;
  reviews: number;
  likes: number;
  featured: boolean;
  verified: boolean;
  screenshots?: string[];
  category: string;
  compatibility: string[];
  lastUpdated: string;
  authorAvatar?: string;
  authorBio?: string;
  authorVerified?: boolean;
  premium?: boolean;
  price?: number;
}

interface WorkspaceReview {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

const MOCK_MARKETPLACE_WORKSPACES: MarketplaceWorkspace[] = [
  {
    ...WORKSPACE_TEMPLATES['executive-dashboard'],
    downloads: 1247,
    rating: 4.8,
    reviews: 89,
    likes: 234,
    featured: true,
    verified: true,
    category: 'Business',
    compatibility: ['web', 'mobile', 'tablet'],
    lastUpdated: '2024-01-15',
    authorAvatar: '/avatars/nexus-team.jpg',
    authorBio: 'Official Nexus templates, designed by our expert team',
    authorVerified: true,
    screenshots: ['/screenshots/exec-dashboard-1.jpg', '/screenshots/exec-dashboard-2.jpg']
  },
  {
    ...WORKSPACE_TEMPLATES['sales-workspace'],
    downloads: 892,
    rating: 4.6,
    reviews: 67,
    likes: 156,
    featured: true,
    verified: true,
    category: 'Sales',
    compatibility: ['web', 'mobile'],
    lastUpdated: '2024-01-12',
    authorAvatar: '/avatars/nexus-team.jpg',
    authorBio: 'Official Nexus templates, designed by our expert team',
    authorVerified: true
  },
  {
    id: 'community-startup-dashboard',
    name: 'Startup Command Center',
    description: 'All-in-one workspace for startup founders and early teams',
    author: 'Sarah Chen',
    authorAvatar: '/avatars/sarah-chen.jpg',
    authorBio: 'Startup founder, built 3 companies from 0 to exit',
    authorVerified: false,
    isPublic: true,
    tags: ['startup', 'founder', 'metrics', 'growth'],
    templateType: 'executive-dashboard',
    version: '2.1.0',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-14'),
    components: [
      {
        id: 'startup-metrics',
        componentId: 'business-metrics',
        position: { x: 0, y: 0 },
        size: { width: 8, height: 6 },
        config: { startupMode: true, showBurnRate: true, showRunway: true },
        visible: true
      },
      {
        id: 'startup-tasks',
        componentId: 'tasks-widget',
        position: { x: 8, y: 0 },
        size: { width: 4, height: 6 },
        config: { startupTasks: true, showMilestones: true },
        visible: true
      }
    ],
    downloads: 445,
    rating: 4.7,
    reviews: 34,
    likes: 89,
    featured: false,
    verified: false,
    category: 'Startup',
    compatibility: ['web', 'mobile', 'tablet'],
    lastUpdated: '2024-01-14',
    premium: true,
    price: 9.99
  },
  {
    id: 'community-designer-workspace',
    name: 'Creative Designer Hub',
    description: 'Perfect workspace for designers and creative professionals',
    author: 'Alex Rodriguez',
    authorAvatar: '/avatars/alex-rodriguez.jpg',
    authorBio: 'Senior UX Designer at top tech companies',
    authorVerified: true,
    isPublic: true,
    tags: ['design', 'creative', 'portfolio', 'inspiration'],
    templateType: 'marketing-hub',
    version: '1.5.0',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-13'),
    components: [
      {
        id: 'design-ideas',
        componentId: 'ideas-widget',
        position: { x: 0, y: 0 },
        size: { width: 6, height: 6 },
        config: { designMode: true, showInspiration: true },
        visible: true
      }
    ],
    downloads: 267,
    rating: 4.9,
    reviews: 18,
    likes: 67,
    featured: false,
    verified: true,
    category: 'Design',
    compatibility: ['web', 'tablet'],
    lastUpdated: '2024-01-13'
  }
];

const MOCK_REVIEWS: WorkspaceReview[] = [
  {
    id: 'review-1',
    workspaceId: 'template-executive-dashboard',
    userId: 'user-1',
    userName: 'Michael Johnson',
    userAvatar: '/avatars/michael-johnson.jpg',
    rating: 5,
    comment: 'Incredible workspace! Saved me hours of setup time. The executive view is exactly what I needed.',
    createdAt: new Date('2024-01-10'),
    helpful: 12,
    verified: true
  },
  {
    id: 'review-2',
    workspaceId: 'template-executive-dashboard',
    userId: 'user-2',
    userName: 'Lisa Wang',
    rating: 4,
    comment: 'Great template, though I wish it had more customization options for the metrics display.',
    createdAt: new Date('2024-01-08'),
    helpful: 8,
    verified: false
  }
];

const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const icons: Record<string, React.ReactNode> = {
    'Business': <Briefcase className="w-4 h-4" />,
    'Sales': <Target className="w-4 h-4" />,
    'Marketing': <Zap className="w-4 h-4" />,
    'Design': <Palette className="w-4 h-4" />,
    'Development': <Code className="w-4 h-4" />,
    'Analytics': <PieChart className="w-4 h-4" />,
    'Startup': <Sparkles className="w-4 h-4" />,
    'Finance': <TrendingUp className="w-4 h-4" />,
    'HR': <Users className="w-4 h-4" />,
    'Operations': <Grid className="w-4 h-4" />
  };
  return icons[category] || <Layout className="w-4 h-4" />;
};

const WorkspaceCard: React.FC<{
  workspace: MarketplaceWorkspace;
  onPreview: (workspace: MarketplaceWorkspace) => void;
  onInstall: (workspace: MarketplaceWorkspace) => void;
  onLike: (workspace: MarketplaceWorkspace) => void;
  viewMode: 'grid' | 'list';
}> = ({ workspace, onPreview, onInstall, onLike, viewMode }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(workspace);
  };

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <CategoryIcon category={workspace.category} />
                {workspace.featured && <Crown className="w-4 h-4 text-warning" />}
                {workspace.verified && <Shield className="w-4 h-4 text-primary" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-lg">{workspace.name}</h3>
                  {workspace.premium && <Badge variant="secondary">Pro</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{workspace.description}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={workspace.authorAvatar} />
                      <AvatarFallback>{workspace.author.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{workspace.author}</span>
                    {workspace.authorVerified && <Shield className="w-3 h-3 text-primary" />}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-warning" />
                    <span>{workspace.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="w-3 h-3" />
                    <span>{workspace.downloads.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleLike}>
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-destructive' : ''}`} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onPreview(workspace)}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button size="sm" onClick={() => onInstall(workspace)}>
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CategoryIcon category={workspace.category} />
            <Badge variant="outline">{workspace.category}</Badge>
            {workspace.featured && <Crown className="w-4 h-4 text-warning" />}
            {workspace.verified && <Shield className="w-4 h-4 text-primary" />}
            {workspace.premium && <Badge variant="secondary">Pro</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={handleLike}>
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-destructive' : ''}`} />
          </Button>
        </div>
        
        <CardTitle className="text-lg">{workspace.name}</CardTitle>
        <CardDescription className="line-clamp-2">{workspace.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Avatar className="w-5 h-5">
                <AvatarImage src={workspace.authorAvatar} />
                <AvatarFallback>{workspace.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">{workspace.author}</span>
              {workspace.authorVerified && <Shield className="w-3 h-3 text-primary" />}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-warning" />
              <span className="font-medium">{workspace.rating}</span>
              <span className="text-muted-foreground">({workspace.reviews})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Download className="w-3 h-3" />
                <span>{workspace.downloads.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3" />
                <span>{workspace.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{workspace.lastUpdated}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {workspace.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {workspace.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{workspace.tags.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onPreview(workspace)} className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" onClick={() => onInstall(workspace)} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const WorkspacePreview: React.FC<{
  workspace: MarketplaceWorkspace;
  onClose: () => void;
  onInstall: (workspace: MarketplaceWorkspace) => void;
}> = ({ workspace, onClose, onInstall }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews] = useState(MOCK_REVIEWS.filter(r => r.workspaceId === workspace.id));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <CategoryIcon category={workspace.category} />
              <div>
                <DialogTitle className="text-xl">{workspace.name}</DialogTitle>
                <DialogDescription className="flex items-center space-x-2 mt-1">
                  <span>by {workspace.author}</span>
                  {workspace.authorVerified && <Shield className="w-3 h-3 text-primary" />}
                  {workspace.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                  {workspace.premium && <Badge variant="secondary" className="text-xs">Pro</Badge>}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-warning" />
                <span className="font-medium">{workspace.rating}</span>
                <span className="text-muted-foreground">({workspace.reviews})</span>
              </div>
              <Button onClick={() => onInstall(workspace)}>
                <Download className="w-4 h-4 mr-2" />
                Install Workspace
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="author">Author</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{workspace.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Stats</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>{workspace.downloads.toLocaleString()} downloads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>{workspace.likes} likes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Updated {workspace.lastUpdated}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Layout className="w-4 h-4" />
                    <span>{workspace.components.length} components</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {workspace.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Compatibility</h3>
              <div className="flex space-x-2">
                {workspace.compatibility.map(platform => (
                  <Badge key={platform} variant="outline">{platform}</Badge>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="components" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Included Components ({workspace.components.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspace.components.map(component => {
                  const metadata = workspaceComponentRegistry.getComponent(component.componentId);
                  return (
                    <Card key={component.id} className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="font-medium">{metadata?.name || component.componentId}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {metadata?.description || 'Custom component'}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Reviews ({reviews.length})</h3>
              <div className="space-y-4">
                {reviews.map(review => (
                  <Card key={review.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{review.userName}</span>
                          {review.verified && <Shield className="w-3 h-3 text-primary" />}
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? 'text-warning fill-yellow-500' : 'text-muted-foreground/60'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{review.createdAt.toLocaleDateString()}</span>
                          <button className="flex items-center space-x-1 hover:text-foreground">
                            <ThumbsUp className="w-3 h-3" />
                            <span>Helpful ({review.helpful})</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="author" className="space-y-4">
            <div className="flex items-start space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={workspace.authorAvatar} />
                <AvatarFallback>{workspace.author.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-lg">{workspace.author}</h3>
                  {workspace.authorVerified && <Shield className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-muted-foreground">{workspace.authorBio}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export const WorkspaceMarketplace: React.FC = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<MarketplaceWorkspace[]>(MOCK_MARKETPLACE_WORKSPACES);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<MarketplaceWorkspace[]>(workspaces);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'downloads'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewWorkspace, setPreviewWorkspace] = useState<MarketplaceWorkspace | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['all', ...Array.from(new Set(workspaces.map(w => w.category)))];

  // Filter and sort workspaces
  useEffect(() => {
    let filtered = workspaces;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(w => w.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.downloads + b.likes) - (a.downloads + a.likes));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'downloads':
        filtered.sort((a, b) => b.downloads - a.downloads);
        break;
    }

    setFilteredWorkspaces(filtered);
  }, [workspaces, searchTerm, selectedCategory, sortBy]);

  const handleInstall = (workspace: MarketplaceWorkspace) => {
    try {
      // Create a new workspace from the template
      const newWorkspace = {
        ...workspace,
        id: `installed-${Date.now()}`,
        name: `${workspace.name} (Copy)`,
        author: user?.email || 'Unknown',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save to registry
      workspaceComponentRegistry.saveLayout(newWorkspace);
      
      // Update download count
      setWorkspaces(prev => prev.map(w => 
        w.id === workspace.id 
          ? { ...w, downloads: w.downloads + 1 }
          : w
      ));

      toast.success(`"${workspace.name}" installed successfully!`);
      setPreviewWorkspace(null);
    } catch (error) {
      toast.error('Failed to install workspace');
      console.error('Installation error:', error);
    }
  };

  const handleLike = (workspace: MarketplaceWorkspace) => {
    setWorkspaces(prev => prev.map(w => 
      w.id === workspace.id 
        ? { ...w, likes: w.likes + 1 }
        : w
    ));
  };

  const handlePreview = (workspace: MarketplaceWorkspace) => {
    setPreviewWorkspace(workspace);
  };

  const recommendations = user ? getTemplateRecommendations({
    role: user.role,
    department: user.department,
    experience: 'intermediate',
    goals: ['productivity', 'analytics']
  }) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Marketplace</h1>
          <p className="text-muted-foreground">Discover and install workspaces created by the community</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-warning" />
              <span>Recommended for You</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 3).map(rec => {
                const workspace = workspaces.find(w => w.templateType === rec.template);
                if (!workspace) return null;
                return (
                  <Card key={workspace.id} className="p-4 border-2 border-yellow-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CategoryIcon category={workspace.category} />
                      <span className="font-medium">{workspace.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {rec.score}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                    <Button size="sm" onClick={() => handleInstall(workspace)} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Install
                    </Button>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="downloads">Most Downloaded</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map(workspace => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onPreview={handlePreview}
                onInstall={handleInstall}
                onLike={handleLike}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkspaces.map(workspace => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onPreview={handlePreview}
                onInstall={handleInstall}
                onLike={handleLike}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewWorkspace && (
        <WorkspacePreview
          workspace={previewWorkspace}
          onClose={() => setPreviewWorkspace(null)}
          onInstall={handleInstall}
        />
      )}
    </div>
  );
};

export default WorkspaceMarketplace; 