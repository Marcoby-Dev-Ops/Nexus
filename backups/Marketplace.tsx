import React from 'react';
import { Store, Download, Star, Search, Filter, Plus, Zap, Bot, BarChart2 } from 'lucide-react';
import { PageTemplates } from '@/components/patterns/PageTemplates';
import { ContentCard } from '@/components/patterns/ContentCard';

/**
 * @name Marketplace
 * @description Pulse marketplace for discovering and installing business apps and integrations.
 * @returns {JSX.Element} The rendered Marketplace component.
 */

// Sample marketplace apps data
const featuredApps = [
  {
    id: 1,
    name: 'CRM Pro',
    description: 'Advanced customer relationship management with AI insights',
    category: 'Sales',
    rating: 4.8,
    downloads: 1200,
    price: 'Free',
    icon: <Bot className="w-8 h-8" />,
    features: ['Lead Management', 'Sales Pipeline', 'AI Insights']
  },
  {
    id: 2,
    name: 'Analytics Plus',
    description: 'Comprehensive business analytics and reporting suite',
    category: 'Analytics',
    rating: 4.6,
    downloads: 950,
    price: '$29/month',
    icon: <BarChart2 className="w-8 h-8" />,
    features: ['Advanced Reports', 'Custom Dashboards', 'Data Export']
  },
  {
    id: 3,
    name: 'Workflow Automation',
    description: 'Automate repetitive tasks and streamline your processes',
    category: 'Operations',
    rating: 4.9,
    downloads: 2100,
    price: '$15/month',
    icon: <Zap className="w-8 h-8" />,
    features: ['Task Automation', 'Process Builder', 'Integration Hub']
  }
];

const categories = [
  { name: 'All', count: 45, active: true },
  { name: 'Sales', count: 12, active: false },
  { name: 'Finance', count: 8, active: false },
  { name: 'Operations', count: 15, active: false },
  { name: 'Analytics', count: 10, active: false },
];

const Marketplace: React.FC = () => {
  return (
    <PageTemplates.Department
      title="Pulse Marketplace"
      subtitle="Discover and install business apps to extend your NEXUS capabilities"
    >
      {/* Search and Filters */}
      <ContentCard variant="elevated" className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search apps and integrations..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-lg transition-colors duration-200">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-colors duration-200 border border-border">
              <Plus className="w-4 h-4" />
              <span>Submit App</span>
            </button>
          </div>
        </div>
      </ContentCard>

      {/* Categories */}
      <ContentCard title="Categories" variant="elevated" className="mb-8">
        <div className="flex flex-wrap gap-4">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 border ${
                category.active
                  ? 'bg-primary/10 text-primary border-primary'
                  : 'bg-muted text-foreground hover:bg-muted/80 border-border'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </ContentCard>

      {/* Featured Apps */}
      <ContentCard 
        title="Featured Apps" 
        variant="elevated"
        action={
          <button className="px-4 py-2 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary/90 rounded-lg transition-all duration-200 text-sm font-medium border border-border">
            View All
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredApps.map((app) => (
            <div key={app.id} className="border border-border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200 bg-background">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 rounded-lg bg-primary/10 text-primary">
                  {app.icon}
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-warning mb-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium text-foreground">{app.rating}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{app.downloads} downloads</div>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">{app.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{app.description}</p>
              
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {app.features.map((feature, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-muted text-foreground text-xs rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{app.category}</span>
                  <span className="font-semibold text-primary">{app.price}</span>
                </div>
              </div>
              
              <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors duration-200 font-medium border border-primary">
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>
            </div>
          ))}
        </div>
      </ContentCard>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContentCard variant="elevated" className="text-center">
          <div className="p-4 rounded-lg bg-primary/10 text-primary mx-auto w-fit mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">45+</h3>
          <p className="text-muted-foreground">Available Apps</p>
        </ContentCard>
        
        <ContentCard variant="elevated" className="text-center">
          <div className="p-4 rounded-lg bg-success/10 text-success mx-auto w-fit mb-4">
            <Download className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">5.2K+</h3>
          <p className="text-muted-foreground">Total Downloads</p>
        </ContentCard>
        
        <ContentCard variant="elevated" className="text-center">
          <div className="p-4 rounded-lg bg-warning/10 text-warning mx-auto w-fit mb-4">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">4.7</h3>
          <p className="text-muted-foreground">Average Rating</p>
        </ContentCard>
      </div>
    </PageTemplates.Department>
  );
};

export default Marketplace; 