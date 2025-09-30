import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Edit3,
  Plus,
  CheckCircle,
  ArrowRight,
  Download,
  Upload,
  Save
} from "lucide-react"
import { IdentityManager } from '@/lib/identity/identity-manager'
import { IdentitySectionForm } from './identity-section-form'
import type { BusinessIdentity, IdentitySection, CompletionStatus } from '@/lib/identity/types'

interface IdentityDashboardProps {
  className?: string
}

export function IdentityDashboard({ className }: IdentityDashboardProps) {
  const [identityManager] = useState(() => new IdentityManager())
  const [identity, setIdentity] = useState<BusinessIdentity>(identityManager.getIdentity())
  const [nextAction, setNextAction] = useState(identityManager.getNextAction())
  const [editingSection, setEditingSection] = useState<IdentitySection | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  useEffect(() => {
    // Load from database with localStorage fallback on mount
    const loadIdentity = async () => {
      const loaded = await identityManager.loadFromDatabase()
      if (loaded) {
        setIdentity(identityManager.getIdentity())
        setNextAction(identityManager.getNextAction())
      }
    }
    loadIdentity()
  }, [])

  const handleSave = async () => {
    const saved = await identityManager.saveToDatabase()
    if (saved) {
      alert('Identity data saved to database successfully!')
    } else {
      alert('Identity data saved to local storage (database unavailable)')
    }
  }

  const handleEditSection = (section: IdentitySection) => {
    setEditingSection(section)
  }

  const handleSaveSection = async (section: IdentitySection, data: any) => {
    identityManager.updateSection(section, data)
    const saved = await identityManager.saveToDatabase() // Auto-save after updating
    setIdentity(identityManager.getIdentity())
    setNextAction(identityManager.getNextAction())
    setEditingSection(null)
    // Show success feedback
    if (saved) {
      alert(`${section} updated and saved to database successfully!`)
    } else {
      alert(`${section} updated and saved to local storage (database unavailable)`)
    }
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
  }

  const handleExport = () => {
    const data = identityManager.exportIdentity()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nexus-identity-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExportDialog(false)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
          const success = identityManager.importIdentity(data)
          if (success) {
            setIdentity(identityManager.getIdentity())
            setNextAction(identityManager.getNextAction())
            alert('Identity data imported successfully!')
          } else {
            alert('Failed to import identity data. Please check the file format.')
          }
        } catch (error) {
          alert('Error importing file. Please check the file format.')
        }
      }
      reader.readAsText(file)
    }
    setShowImportDialog(false)
  }

  const handleGetStarted = () => {
    handleEditSection(nextAction.section)
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

  const sections = [
    {
      key: 'foundation' as IdentitySection,
      title: 'Company Foundation',
      description: 'Basic company information and structure'
    },
    {
      key: 'missionVisionValues' as IdentitySection,
      title: 'Mission & Values',
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Identity Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive business context for AI assistance and strategic planning
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

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
          </div>
        </CardContent>
      </Card>

      {/* Identity Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections.map((section) => {
          const status = identityManager.getSectionStatus(section.key)
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
              {sections.filter(s => identityManager.getSectionStatus(s.key) === 'Complete').length}
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
              {sections.filter(s => identityManager.getSectionStatus(s.key) === 'In Progress').length}
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

      {/* Edit Section Dialog */}
      <Dialog open={editingSection !== null} onOpenChange={() => setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Identity Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your business identity data as a JSON file. This file can be imported later or shared with team members.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
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
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
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
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
