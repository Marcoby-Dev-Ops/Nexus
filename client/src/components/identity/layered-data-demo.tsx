import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Building2, 
  Target, 
  Users, 
  Settings, 
  TrendingUp, 
  Package,
  Eye,
  Database
} from "lucide-react"
import { 
  getFoundationView, 
  getMissionView, 
  getMarketView, 
  getOperationsView, 
  getStrategicView,
  getProductsView,
  getExecutiveSummary,
  getDashboardView 
} from '@/lib/identity/presentation-views'
import { getIndustryLabel } from '@/lib/identity/industry-options'
import type { BusinessIdentity } from '@/lib/identity/types'

interface LayeredDataDemoProps {
  identity: BusinessIdentity
}

export function LayeredDataDemo({ identity }: LayeredDataDemoProps) {
  const [showRawData, setShowRawData] = useState(false)

  // Generate different views of the same data
  const foundationView = getFoundationView(identity)
  const missionView = getMissionView(identity)
  const marketView = getMarketView(identity)
  const operationsView = getOperationsView(identity)
  const strategicView = getStrategicView(identity)
  const productsView = getProductsView(identity)
  const executiveSummary = getExecutiveSummary(identity)
  const dashboardView = getDashboardView(identity)

  const views = [
    { id: 'foundation', label: 'Foundation', icon: Building2, data: foundationView },
    { id: 'mission', label: 'Mission', icon: Target, data: missionView },
    { id: 'market', label: 'Market', icon: Users, data: marketView },
    { id: 'operations', label: 'Operations', icon: Settings, data: operationsView },
    { id: 'strategic', label: 'Strategic', icon: TrendingUp, data: strategicView },
    { id: 'products', label: 'Products', icon: Package, data: productsView },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Layered Data Architecture Demo
          </CardTitle>
          <CardDescription>
            Same data, different presentations. Each view focuses on specific aspects of your business identity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              variant={showRawData ? "default" : "outline"}
              onClick={() => setShowRawData(!showRawData)}
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showRawData ? 'Hide' : 'Show'} Raw Data
            </Button>
            <Badge variant="secondary">
              Single Source of Truth
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Raw Data View */}
      {showRawData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data (Single Source of Truth)</CardTitle>
            <CardDescription>
              This is the authoritative data stored in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96">
              {JSON.stringify(identity, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
          <CardDescription>
            High-level overview combining key insights from all layers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Company</h4>
              <p className="text-sm text-muted-foreground">
                {executiveSummary.company.name} • {getIndustryLabel(executiveSummary.company.industry)} • {executiveSummary.company.stage}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Mission</h4>
              <p className="text-sm">{executiveSummary.mission}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Value Proposition</h4>
              <p className="text-sm">{executiveSummary.valueProposition}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Target Market</h4>
              <p className="text-sm">{executiveSummary.targetMarket}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layered Views */}
      <Tabs defaultValue="foundation" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {views.map((view) => {
            const Icon = view.icon
            return (
              <TabsTrigger key={view.id} value={view.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {views.map((view) => (
          <TabsContent key={view.id} value={view.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <view.icon className="h-5 w-5" />
                  {view.label} Focus
                </CardTitle>
                <CardDescription>
                  Same data presented through a {view.label.toLowerCase()} lens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96">
                  {JSON.stringify(view.data, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits of Layered Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Single Source of Truth</h4>
              <p className="text-sm text-muted-foreground">
                Data stored once, referenced everywhere
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">No Duplication</h4>
              <p className="text-sm text-muted-foreground">
                Same data, different presentations
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Flexible Focuses</h4>
              <p className="text-sm text-muted-foreground">
                Each view emphasizes different aspects
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Easy Updates</h4>
              <p className="text-sm text-muted-foreground">
                Change once, reflects everywhere
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Scalable</h4>
              <p className="text-sm text-muted-foreground">
                Add new focuses without schema changes
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Consistent</h4>
              <p className="text-sm text-muted-foreground">
                All views use the same underlying data
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
