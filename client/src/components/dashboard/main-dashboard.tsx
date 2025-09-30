import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  BarChart3, 
  Brain, 
  Target, 
  Zap, 
  Clock,
  Building2,
  DollarSign,
  Wallet,
  Package,
  Users,
  FileText,
  Settings,
  TrendingUp,
  Activity,
  AlertCircle
} from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"

export function MainDashboard() {
  const { data, loading, error, refetch } = useDashboard()

  // Category to icon mapping
  const categoryIcons: Record<string, any> = {
    'identity': Building2,
    'revenue': DollarSign,
    'cash': Wallet,
    'delivery': Package,
    'people': Users,
    'knowledge': FileText,
    'systems': Settings,
    'sales': Target,
    'marketing': TrendingUp,
    'operations': Activity,
  }

  const categoryColors: Record<string, string> = {
    'identity': 'text-blue-600',
    'revenue': 'text-green-600',
    'cash': 'text-emerald-600',
    'delivery': 'text-purple-600',
    'people': 'text-orange-600',
    'knowledge': 'text-indigo-600',
    'systems': 'text-gray-600',
    'sales': 'text-red-600',
    'marketing': 'text-pink-600',
    'operations': 'text-cyan-600',
  }

  // Transform building blocks data for display
  const buildingBlocks = data?.buildingBlocks.map(block => {
    const userImplementation = data.userImplementations.find(impl => impl.building_block_id === block.id)
    const progress = userImplementation?.progress_percentage || 0
    
    return {
      id: block.id,
      name: block.name,
      progress,
      icon: categoryIcons[block.category] || Building2,
      color: categoryColors[block.category] || 'text-gray-600',
      category: block.category,
      status: userImplementation?.status || 'not_started'
    }
  }) || []

  // Mock recent activity (will be replaced with real data later)
  const recentActivity = [
    { type: 'thought', title: 'New product idea', time: '2 hours ago' },
    { type: 'plan', title: 'Q1 marketing strategy', time: '1 day ago' },
    { type: 'action', title: 'Team meeting scheduled', time: '2 days ago' },
  ]

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data: {error}
            <Button variant="outline" size="sm" onClick={refetch} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Dashboard</h2>
          <p className="text-muted-foreground">
            Your comprehensive business health overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            New Thought
          </Button>
          <Button size="sm">
            <Target className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall Business Health
          </CardTitle>
          <CardDescription>
            Comprehensive view of your business performance across all areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm text-muted-foreground">{data?.overallHealth || 0}%</span>
            </div>
            <Progress value={data?.overallHealth || 0} className="h-2" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{data?.stats.totalBlocks || 0}</div>
                <div className="text-xs text-muted-foreground">Total Blocks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{data?.stats.inProgressBlocks || 0}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{data?.stats.completedBlocks || 0}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Building Blocks Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {buildingBlocks.map((block) => {
          const Icon = block.icon
          return (
            <Card key={block.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${block.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {block.progress}%
                  </span>
                </div>
                <CardTitle className="text-base">{block.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Progress value={block.progress} className="h-1" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest thoughts, plans, and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Brain className="h-4 w-4 mr-2" />
                Capture a Thought
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Create a Plan
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Take Action
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Loading skeleton component
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Overall Health Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
              <div>
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </div>
              <div>
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
                <Skeleton className="h-3 w-18 mx-auto" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Building Blocks Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-1 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
