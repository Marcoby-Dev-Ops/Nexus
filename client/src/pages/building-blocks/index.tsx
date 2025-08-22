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
  Crown, Award, Target as TargetIcon2, TrendingUp as TrendingUpIcon2,
  Home, Bell, Calendar as CalendarIcon, CheckSquare
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

  // Since AppWithOnboarding handles the onboarding flow, this page only shows
  // when onboarding is completed. We can focus on the dashboard experience.

  // Set header content for returning users
  React.useEffect(() => {
    const displayName = profile?.display_name || profile?.first_name || 'Entrepreneur';
    
    setHeaderContent(
      'Dashboard', 
      `Welcome back, ${displayName}`
    );
    
    return () => setHeaderContent(null, null);
  }, [profile]);

  // First-time user experience - following SaaS welcome page best practices
  const renderFirstTimeUserExperience = () => (
    <div className="space-y-6">
      {/* Personalized Welcome Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-primary-subtle to-accent-subtle border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-primary/20 rounded-full mr-3">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary">
                Welcome, {profile?.first_name || 'Entrepreneur'}! 🚀
              </CardTitle>
            </div>
            <CardDescription className="text-xl text-foreground">
              Your business operating system is ready to help you succeed
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6 text-lg">
              Let's get you started with the fundamentals that make every business successful.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <ArrowRight className="h-5 w-5 mr-2" />
                Complete Setup
              </Button>
              <Button variant="outline" size="lg">
                <Eye className="h-5 w-5 mr-2" />
                Explore Features
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Getting Started Checklist - Following Userpilot's best practices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Getting Started Checklist
            </CardTitle>
            <CardDescription>
              Complete these steps to unlock your full business potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  step: 1, 
                  title: 'Complete Your Profile', 
                  description: 'Tell us about your business to personalize your experience', 
                  icon: Building2, 
                  completed: false,
                  action: 'Set up profile'
                },
                { 
                  step: 2, 
                  title: 'Connect Your Tools', 
                  description: 'Integrate your existing systems for unified insights', 
                  icon: Zap, 
                  completed: false,
                  action: 'Connect tools'
                },
                { 
                  step: 3, 
                  title: 'Review Your Health Score', 
                  description: 'See how your business is performing across all areas', 
                  icon: BarChart3, 
                  completed: false,
                  action: 'View insights'
                },
                { 
                  step: 4, 
                  title: 'Explore Building Blocks', 
                  description: 'Discover the 7 fundamentals of business success', 
                  icon: Target, 
                  completed: false,
                  action: 'Start exploring'
                }
              ].map((item, index) => (
                <div key={item.step} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${item.completed ? 'bg-success/20' : 'bg-muted'}`}>
                      {item.completed ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="font-medium">{item.title}</span>
                        {item.completed && <Badge variant="secondary" className="ml-2">Complete</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled={item.completed}>
                    {item.action}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sample Data Preview - Following "Show, don't tell" principle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              See Nexus in Action
            </CardTitle>
            <CardDescription>
              Here's what your business dashboard will look like once you're set up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border rounded-lg bg-muted/20">
                <div className="text-2xl font-bold text-primary mb-2">85%</div>
                <div className="text-sm font-medium">Business Health Score</div>
                <p className="text-xs text-muted-foreground mt-1">Your overall performance</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-muted/20">
                <div className="text-2xl font-bold text-success mb-2">+23%</div>
                <div className="text-sm font-medium">Revenue Growth</div>
                <p className="text-xs text-muted-foreground mt-1">This month vs last</p>
              </div>
              <div className="text-center p-4 border rounded-lg bg-muted/20">
                <div className="text-2xl font-bold text-accent mb-2">7/7</div>
                <div className="text-sm font-medium">Building Blocks</div>
                <p className="text-xs text-muted-foreground mt-1">All areas optimized</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Building Blocks Overview - Simplified for first-time users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Your Business Foundation
            </CardTitle>
            <CardDescription>
              The 7 building blocks that compose every successful business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Identity', description: 'Mission, vision, values', icon: Building2, color: 'blue' },
                { name: 'Revenue', description: 'Customers & sales', icon: DollarSign, color: 'green' },
                { name: 'Cash', description: 'Financial operations', icon: TrendingUp, color: 'emerald' },
                { name: 'Delivery', description: 'Products & services', icon: Package, color: 'orange' },
                { name: 'People', description: 'Team & culture', icon: Users, color: 'purple' },
                { name: 'Knowledge', description: 'Data & insights', icon: BookOpen, color: 'indigo' },
                { name: 'Systems', description: 'Tools & processes', icon: Settings, color: 'gray' }
              ].map((block, index) => (
                <div key={block.name} className="p-4 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <block.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{block.name}</h3>
                      <p className="text-xs text-muted-foreground">{block.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Button variant="outline">
                <ArrowRight className="h-4 w-4 mr-2" />
                Explore All Building Blocks
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Help Widget - Following Userpilot's recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <HelpCircle className="h-6 w-6 text-primary mr-2" />
              <span className="font-medium">Need help getting started?</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Our team is here to help you succeed. Get instant support or schedule a personalized walkthrough.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat with Support
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // Returning user experience - show a streamlined dashboard
  const renderReturningUserExperience = () => (
    <div className="space-y-6">
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Home className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Bell className="h-6 w-6 mb-2" />
                <span className="text-sm">Notifications</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <CalendarIcon className="h-6 w-6 mb-2" />
                <span className="text-sm">Calendar</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <CheckSquare className="h-6 w-6 mb-2" />
                <span className="text-sm">Tasks</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Health Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Business Health Overview
            </CardTitle>
            <CardDescription>
              Your business performance at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">85%</div>
                <div className="text-sm text-muted-foreground">Overall Health</div>
                <Progress value={85} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">92%</div>
                <div className="text-sm text-muted-foreground">Revenue Growth</div>
                <Progress value={92} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">78%</div>
                <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                <Progress value={78} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Building Blocks Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Building Blocks Status
            </CardTitle>
            <CardDescription>
              Track your progress across the 7 fundamental building blocks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Identity', progress: 90, color: 'blue' },
                { name: 'Revenue', progress: 85, color: 'green' },
                { name: 'Cash', progress: 75, color: 'emerald' },
                { name: 'Delivery', progress: 88, color: 'orange' },
                { name: 'People', progress: 82, color: 'purple' },
                { name: 'Knowledge', progress: 70, color: 'indigo' },
                { name: 'Systems', progress: 95, color: 'gray' }
              ].map((block, index) => (
                <div key={block.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{block.name}</span>
                    <span className="text-sm text-muted-foreground">{block.progress}%</span>
                  </div>
                  <Progress value={block.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Revenue goal achieved', time: '2 hours ago', type: 'success' },
                { action: 'New customer onboarded', time: '4 hours ago', type: 'info' },
                { action: 'Team meeting scheduled', time: '6 hours ago', type: 'warning' },
                { action: 'System update completed', time: '1 day ago', type: 'info' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-success mr-3" />
                    <span className="text-sm">{activity.action}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

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
    <div className="p-6">
      {renderReturningUserExperience()}
    </div>
  );
};

export default BuildingBlocksPage;
