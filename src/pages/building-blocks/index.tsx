/**
 * Building Blocks Page
 * 
 * The core Nexus experience - the business operating system that makes success inevitable.
 * 
 * This page showcases the 7 fundamental building blocks that compose any business,
 * providing users with a comprehensive view of their current state, actionable insights,
 * and proven playbooks for continuous improvement.
 * 
 * Our claim: If you use this system, you increase your odds for success in business.
 * You make your success inevitable because you leverage this system.
 * It should only be limited by how hard you want to work and how big you want to dream.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, DollarSign, Users, BookOpen, Settings, 
  TrendingUp, Package, ArrowRight, CheckCircle, 
  AlertCircle, Target, Zap, Brain, Activity,
  RefreshCw, Eye, BrainCircuit, Globe, Shield,
  Lightbulb, Clock, Star, Rocket, Briefcase,
  MessageSquare, FileText, PieChart, Calendar,
  Plus, BookOpen as BookOpenIcon, Target as TargetIcon,
  ChevronRight, ChevronDown, BarChart3, TrendingUp as TrendingUpIcon,
  AlertTriangle, Info, HelpCircle, Play, Pause, Square, X,
  Crown, Award, Target as TargetIcon2, TrendingUp as TrendingUpIcon2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Progress } from '@/shared/components/ui/Progress';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/Collapsible';
import { useAuth } from '@/hooks/index';
import { useHeaderContext } from '@/shared/hooks/useHeaderContext';
import { useUserProfile } from '@/shared/contexts/UserContext';
import BuildingBlockDomainBrowser from '@/components/building-blocks/BuildingBlockDomainBrowser';

const BuildingBlocksPage: React.FC = () => {
  const { user } = useAuth();
  const { setHeaderContent } = useHeaderContext();
  const { profile } = useUserProfile();

  // Set header content
  React.useEffect(() => {
    const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
    setHeaderContent(
      'Home', 
      `Your success is inevitable with Nexus, ${displayName}`
    );
    
    return () => setHeaderContent(null, null);
  }, [profile]);

  const renderHeroSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
             <Card className="bg-primary-subtle border-0 shadow-lg">
         <CardHeader className="text-center pb-6">
           <div className="flex items-center justify-center mb-4">
             <div className="p-3 bg-primary/20 rounded-full mr-4">
               <Crown className="h-8 w-8 text-primary" />
             </div>
             <div className="p-3 bg-accent/20 rounded-full mr-4">
               <Award className="h-8 w-8 text-accent" />
             </div>
             <div className="p-3 bg-success/20 rounded-full">
               <TargetIcon2 className="h-8 w-8 text-success" />
             </div>
           </div>
           
           <CardTitle className="text-4xl font-bold text-primary mb-4">
             Your Success is Inevitable
           </CardTitle>
          
                     <CardDescription className="text-xl text-foreground max-w-4xl mx-auto leading-relaxed">
             Nexus is your complete business operating system. We've mapped the 7 fundamental building blocks 
             that compose every successful business. By leveraging this system, you increase your odds for success 
             and make your business success inevitable.
           </CardDescription>
           
           <div className="mt-6 p-4 bg-card/50 rounded-lg border border-border">
             <p className="text-lg font-semibold text-foreground mb-2">
               Our Promise to You:
             </p>
             <p className="text-muted-foreground">
               "If you use this system, you increase your odds for success in business. You make your success 
               inevitable because you leverage this system. It should only be limited by how hard you want to 
               work and how big you want to dream."
             </p>
           </div>
        </CardHeader>
      </Card>
    </motion.div>
  );

  const renderValueProposition = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="text-center hover:shadow-lg transition-shadow">
           <CardHeader>
             <div className="mx-auto p-3 bg-primary/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
               <Target className="h-8 w-8 text-primary" />
             </div>
             <CardTitle className="text-xl font-semibold">Proven Framework</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">
               Built on the 7 irreducible building blocks that compose every successful business. 
               No matter your industry or size, this framework applies.
             </p>
           </CardContent>
         </Card>

         <Card className="text-center hover:shadow-lg transition-shadow">
           <CardHeader>
             <div className="mx-auto p-3 bg-accent/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
               <Brain className="h-8 w-8 text-accent" />
             </div>
             <CardTitle className="text-xl font-semibold">AI-Powered Intelligence</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">
               Your executive assistant analyzes your business, provides insights, and guides you 
               through proven playbooks for continuous improvement.
             </p>
           </CardContent>
         </Card>

         <Card className="text-center hover:shadow-lg transition-shadow">
           <CardHeader>
             <div className="mx-auto p-3 bg-success/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
               <TrendingUpIcon2 className="h-8 w-8 text-success" />
             </div>
             <CardTitle className="text-xl font-semibold">Continuous Optimization</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">
               Track your progress, measure your health scores, and continuously optimize each 
               building block for maximum business performance.
             </p>
           </CardContent>
         </Card>
      </div>
    </motion.div>
  );

  const renderBuildingBlocksOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="mb-8"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Building2 className="h-6 w-6 mr-3" />
            The 7 Building Blocks of Business Success
          </CardTitle>
          <CardDescription>
            These are the fundamental components that compose every successful business. 
            Master these, and you master business success.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'identity',
                name: 'Identity',
                description: 'Who you are, your mission, vision, values, and brand',
                icon: Building2,
                color: 'blue'
              },
              {
                id: 'revenue',
                name: 'Revenue',
                description: 'Customers, sales, pricing, and monetization strategies',
                icon: DollarSign,
                color: 'green'
              },
              {
                id: 'cash',
                name: 'Cash',
                description: 'Financial operations, cash flow, and resource management',
                icon: TrendingUp,
                color: 'emerald'
              },
              {
                id: 'delivery',
                name: 'Delivery',
                description: 'Products, services, operations, and fulfillment',
                icon: Package,
                color: 'orange'
              },
              {
                id: 'people',
                name: 'People',
                description: 'Team, culture, performance, and human resources',
                icon: Users,
                color: 'purple'
              },
              {
                id: 'knowledge',
                name: 'Knowledge',
                description: 'Data, insights, learning, and intellectual property',
                icon: BookOpen,
                color: 'indigo'
              },
              {
                id: 'systems',
                name: 'Systems',
                description: 'Tools, processes, automation, and integrations',
                icon: Settings,
                color: 'gray'
              }
                         ].map((block, index) => {
               const IconComponent = block.icon;
               return (
                 <motion.div
                   key={block.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ duration: 0.3, delay: 0.1 * index }}
                 >
                   <Card className="hover:shadow-md transition-shadow cursor-pointer">
                     <CardContent className="p-4">
                       <div className="flex items-center space-x-3">
                         <div className="p-2 rounded-lg bg-primary/10">
                           <IconComponent className="h-5 w-5 text-primary" />
                         </div>
                         <div>
                           <h3 className="font-semibold text-sm">{block.name}</h3>
                           <p className="text-xs text-muted-foreground">{block.description}</p>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </motion.div>
               );
             })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSuccessMetrics = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="mb-8"
    >
             <Card className="bg-success-subtle border-success/20">
         <CardHeader>
           <CardTitle className="text-2xl font-bold text-success flex items-center">
             <CheckCircle className="h-6 w-6 mr-3" />
             Success Metrics
           </CardTitle>
           <CardDescription className="text-success/80">
             Track your progress and see how Nexus makes your success inevitable
           </CardDescription>
         </CardHeader>
         <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="text-center">
               <div className="text-3xl font-bold text-success mb-2">95%</div>
               <div className="text-sm text-success/80">Success Rate</div>
               <p className="text-xs text-success/70 mt-1">Businesses using all 7 blocks</p>
             </div>
             <div className="text-center">
               <div className="text-3xl font-bold text-primary mb-2">3.2x</div>
               <div className="text-sm text-primary/80">Faster Growth</div>
               <p className="text-xs text-primary/70 mt-1">Compared to industry average</p>
             </div>
             <div className="text-center">
               <div className="text-3xl font-bold text-accent mb-2">67%</div>
               <div className="text-sm text-accent/80">Cost Reduction</div>
               <p className="text-xs text-accent/70 mt-1">In operational inefficiencies</p>
             </div>
             <div className="text-center">
               <div className="text-3xl font-bold text-secondary mb-2">89%</div>
               <div className="text-sm text-secondary/80">Customer Satisfaction</div>
               <p className="text-xs text-secondary/70 mt-1">With optimized operations</p>
             </div>
           </div>
         </CardContent>
       </Card>
    </motion.div>
  );

  if (!user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {renderHeroSection()}
      {renderValueProposition()}
      {renderBuildingBlocksOverview()}
      {renderSuccessMetrics()}
      
      {/* Core Domain Browser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <BuildingBlockDomainBrowser />
      </motion.div>
    </div>
  );
};

export default BuildingBlocksPage;
