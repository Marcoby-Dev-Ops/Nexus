import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Edit3,
  Plus,
  CheckCircle,
  ArrowRight,
  Download,
  Upload,
  Save,
  Building2,
  AlertCircle
} from "lucide-react"
import { IdentitySectionForm } from './identity-section-form'
import type { IdentitySection, CompletionStatus } from '@/lib/identity/types'
import { useIdentity } from '@/hooks/useIdentity'
import { useToast } from '@/shared/ui/components/Toast'
import { getIndustryLabel } from '@/lib/identity/industry-options'

const SECTION_LABELS: Record<IdentitySection, string> = {
  foundation: 'Company Foundation',
  missionVisionValues: 'Mission, Vision, and Values',
  productsServices: 'Products & Services',
  targetMarket: 'Target Market',
  competitiveLandscape: 'Competitive Landscape',
  businessOperations: 'Business Operations',
  financialContext: 'Financial Context',
  strategicContext: 'Strategic Context'
}

interface IdentityDashboardProps {
  className?: string
  showExportDialog?: boolean
  setShowExportDialog?: (show: boolean) => void
  showImportDialog?: boolean
  setShowImportDialog?: (show: boolean) => void
}

export function IdentityDashboard({ 
  className, 
  showExportDialog = false, 
  setShowExportDialog, 
  showImportDialog = false, 
  setShowImportDialog 
}: IdentityDashboardProps) {
  const [editingSection, setEditingSection] = useState<IdentitySection | null>(null)
  const { toast } = useToast()
  
  // Use the new identity hook
  const { 
    identity, 
    isLoading, 
    saveIdentity, 
    updateSection, 
    exportIdentity, 
    importIdentity, 
    nextAction, 
    sectionStatus 
  } = useIdentity()

  const handleSave = async () => {
    if (!identity?.foundation.name?.trim()) {
      toast({
        type: "error",
        title: "Company name required",
        description: "Add a company name before saving your identity data.",
      })
      return
    }

    const success = await saveIdentity()
    
    if (success) {
      toast({
        type: "success",
        title: "Success",
        description: "Identity data saved successfully!",
      })
    } else {
      toast({
        type: "warning",
        title: "Warning",
        description: "Identity saved to local storage (database unavailable)",
      })
    }
  }

  const handleEditSection = (section: IdentitySection) => {
    setEditingSection(section)
  }

  const handleSaveSection = async (section: IdentitySection, data: any) => {
    const label = SECTION_LABELS[section] ?? section

    if (section === 'foundation') {
      const nextName = (data?.name ?? identity?.foundation.name ?? '').trim()
      if (!nextName) {
        toast({
          type: "error",
          title: "Company name required",
          description: "Add a company name before saving your foundation details.",
        })
        return
      }
    }

    setEditingSection(null)
    
    // Update the section
    updateSection(section, data)
    
    // Auto-save after updating
    const success = await saveIdentity()
    
    if (success) {
      toast({
        type: "success",
        title: "Success",
        description: `${label} saved successfully!`,
      })
    } else {
      toast({
        type: "warning",
        title: "Warning",
        description: `${label} saved to local storage only (database unavailable)`,
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
  }

  const handleExport = () => {
    const data = exportIdentity()
    if (!data) return
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-identity-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportDialog?.(false)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
          const success = importIdentity(data)
          if (success) {
            toast({
              type: "success",
              title: "Success",
              description: "Identity data imported successfully!",
            })
          } else {
            toast({
              type: "error",
              title: "Error",
              description: "Failed to import identity data. Please check the file format.",
            })
          }
        } catch (error) {
          toast({
            type: "error",
            title: "Error",
            description: "Error importing file. Please check the file format.",
          })
        }
      }
      reader.readAsText(file)
    }
    setShowImportDialog?.(false)
  }

  const handleGetStarted = () => {
    if (nextAction) {
      handleEditSection(nextAction.section)
    }
  }

  const getStatusColor = (status: CompletionStatus) => {
    switch (status) {
      case 'Complete': return 'text-green-600'
      case 'Needs Review': return 'text-yellow-600'
      case 'In Progress': return 'text-blue-600'
      case 'Not Started': return 'text-muted-foreground'
    }
  }


  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  const editingSectionLabel = editingSection ? SECTION_LABELS[editingSection] ?? editingSection : ''

  const sections = [
    {
      key: 'foundation' as IdentitySection,
      title: 'Company Foundation',
      description: 'Basic company information and structure'
    },
    {
      key: 'missionVisionValues' as IdentitySection,
      title: SECTION_LABELS.missionVisionValues,
      description: 'Purpose, mission, vision, and core values'
    },
    {
      key: 'productsServices' as IdentitySection,
      title: 'Products & Services',
      description: 'What you offer and your value proposition'
    },
    {
      key: 'targetMarket' as IdentitySection,
      title: 'Target Market',
      description: 'Customer segments and personas'
    },
    {
      key: 'competitiveLandscape' as IdentitySection,
      title: 'Competitive Landscape',
      description: 'Competitors and market positioning'
    },
    {
      key: 'businessOperations' as IdentitySection,
      title: 'Business Operations',
      description: 'Team, processes, and technology'
    },
    {
      key: 'financialContext' as IdentitySection,
      title: 'Financial Context',
      description: 'Revenue, funding, and financial goals'
    },
    {
      key: 'strategicContext' as IdentitySection,
      title: 'Strategic Context',
      description: 'Goals, priorities, and challenges'
    }
  ]

  // Show loading state if identity is not loaded yet
  if (isLoading || !identity) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading business identity...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Company Overview - What is {Company Name} */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            What is {identity.foundation.name || "Your Company"}?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Mission & Vision */}
            <div className="space-y-4">
              {identity.missionVisionValues.missionStatement ? (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">MISSION</h4>
                  <p className="text-base leading-relaxed">{identity.missionVisionValues.missionStatement}</p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">MISSION</h4>
                  <p className="text-sm text-muted-foreground">Define your company's purpose and reason for existence</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleEditSection('missionVisionValues')}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Add Mission
                  </Button>
                </div>
              )}
              
              {identity.missionVisionValues.visionStatement ? (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">VISION</h4>
                  <p className="text-base leading-relaxed">{identity.missionVisionValues.visionStatement}</p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">VISION</h4>
                  <p className="text-sm text-muted-foreground">Describe your company's future aspirations and goals</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleEditSection('missionVisionValues')}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Add Vision
                  </Button>
                </div>
              )}
            </div>
            
            {/* Company Details */}
            <div className="space-y-4">
              {identity.foundation.description ? (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">ABOUT</h4>
                  <p className="text-base leading-relaxed">{identity.foundation.description}</p>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-muted rounded-lg">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">ABOUT</h4>
                  <p className="text-sm text-muted-foreground">Describe what your company does and how it creates value</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleEditSection('foundation')}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Add Description
                  </Button>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {identity.foundation.industry && (
                  <div>
                    <span className="text-muted-foreground">Industry:</span>
                    <p className="font-medium">{getIndustryLabel(identity.foundation.industry)}</p>
                  </div>
                )}
                {identity.foundation.companySize && (
                  <div>
                    <span className="text-muted-foreground">Size:</span>
                    <p className="font-medium">{identity.foundation.companySize}</p>
                  </div>
                )}
                {identity.foundation.companyStage && (
                  <div>
                    <span className="text-muted-foreground">Stage:</span>
                    <p className="font-medium">{identity.foundation.companyStage}</p>
                  </div>
                )}
                {identity.foundation.businessModel && (
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p className="font-medium">{identity.foundation.businessModel}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Core Values */}
          {identity.missionVisionValues.coreValues && identity.missionVisionValues.coreValues.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">CORE VALUES</h4>
              <div className="flex flex-wrap gap-2">
                {identity.missionVisionValues.coreValues.map((value, index) => {
                  const valueText = typeof value === 'string' ? value : value.name || '';
                  return (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {valueText}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Call to Action if incomplete */}
          {identity.completeness.overall < 80 && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-200">Complete Your Identity</span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Help others understand what {identity.foundation.name || "your company"} is by completing your business identity.
              </p>
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-950/30">
                <Edit3 className="h-3 w-3 mr-2" />
                Complete Identity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Identity Completeness
          </CardTitle>
          <CardDescription>
            Track your progress in documenting your business identity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{identity.completeness.overall}%</span>
            </div>
            <Progress value={identity.completeness.overall} className="h-2" />
            
            {/* Next Action */}
            {nextAction && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Recommended Next Action</h4>
                  <Badge className={getPriorityColor(nextAction.priority)}>
                    {nextAction.priority} Priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {nextAction.action}
                </p>
                <Button size="sm" variant="outline" onClick={handleGetStarted}>
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Identity Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const status = sectionStatus(section.key)
          const completeness = identity.completeness.sections[section.key]
          
          return (
            <Card key={section.key} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <span className={`text-xs font-medium ${getStatusColor(status)}`}>
                    {status}
                  </span>
                </div>
                <CardDescription className="text-xs">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{completeness}%</span>
                  </div>
                  <Progress value={completeness} className="h-1" />
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditSection(section.key)}
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditSection(section.key)}
                    >
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sections.filter(s => sectionStatus(s.key) === 'Complete').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {sections.length} total sections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sections.filter(s => sectionStatus(s.key) === 'In Progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              sections being worked on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(identity.lastUpdated).toLocaleDateString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(identity.lastUpdated).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Section Dialog - Updated */}
      <Dialog open={editingSection !== null} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {editingSectionLabel}
            </DialogTitle>
            <DialogDescription>
              Update your company's {editingSectionLabel || 'section'} information. Click Save to apply changes.
            </DialogDescription>
          </DialogHeader>
          {editingSection && (
            <IdentitySectionForm
              section={editingSection}
              identity={identity}
              onSave={handleSaveSection}
              onCancel={handleCancelEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={(open) => setShowExportDialog?.(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Identity Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your business identity data as a JSON file. This file can be imported later or shared with team members.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog?.(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => setShowImportDialog?.(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Identity Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import business identity data from a previously exported JSON file.
            </p>
            <div className="space-y-2">
              <label htmlFor="import-file" className="text-sm font-medium">
                Select JSON file
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog?.(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
