import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Save, ArrowLeft, Sparkles, MessageCircle } from "lucide-react"
import { ChatAIAssistant } from "@/components/ai/chat-ai-assistant"
import { ChatFormGrid } from "@/components/ai/chat-form-grid"
import type { BusinessIdentity, IdentitySection } from '@/lib/identity/types'
import { INDUSTRY_OPTIONS, getIndustryValue } from '@/lib/identity/industry-options'

const formatDateForInput = (value: unknown): string => {
  if (!value) return ''

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10)
    }
  }

  return ''
}

const normalizeTagList = (value: unknown): string[] => {
  const candidates = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue
    const trimmed = candidate.trim()
    if (!trimmed) continue

    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue

    seen.add(key)
    normalized.push(trimmed)
  }

  return normalized
}

interface IdentitySectionFormProps {
  section: IdentitySection
  identity: BusinessIdentity
  onSave: (section: IdentitySection, data: any) => void
  onCancel: () => void
}

export function IdentitySectionForm({ section, identity, onSave, onCancel }: IdentitySectionFormProps) {
  const [formData, setFormData] = useState<any>({})
  const [showAIAssistant, setShowAIAssistant] = useState<string | null>(null)
  const [gridMode, setGridMode] = useState<string | null>(null)
  const [newSector, setNewSector] = useState('')

  useEffect(() => {
    // Initialize form data and keep the foundation industry/sectors/name
    // in sync with the global `identity` when it changes. We intentionally
    // avoid stomping on other unsaved fields but ensure the industry value
    // shown to the user reflects the canonical identity value.
    const sectionData = (identity as any)[section] || {}
    console.log('Form initializing/syncing with identity data:', { section, identity, sectionData })

    if (section === 'foundation') {
      const normalizedSectors = normalizeTagList(
        Array.isArray(sectionData?.sectors) && sectionData.sectors.length > 0
          ? sectionData.sectors
          : sectionData?.sector
      )
      const normalizedIndustry = getIndustryValue(sectionData?.industry)

      // If the form is empty, initialize fully. Otherwise only patch
      // the industry/name/sectors so we don't overwrite other in-progress edits.
      setFormData((prev: any) => {
        const isEmpty = !prev || Object.keys(prev).length === 0
        if (isEmpty) {
          setNewSector('')
          return {
            ...sectionData,
            foundedDate: formatDateForInput(sectionData?.foundedDate),
            industry: normalizedIndustry,
            sectors: normalizedSectors,
            sector: normalizedSectors.length > 0
              ? normalizedSectors.join(', ')
              : (typeof sectionData?.sector === 'string' ? sectionData.sector : '')
          }
        }

        // Patch only industry / sectors / name when they differ
        const patches: any = {}
        if (normalizedIndustry && normalizedIndustry !== prev.industry) patches.industry = normalizedIndustry
        if (sectionData?.name && sectionData.name !== prev.name) patches.name = sectionData.name
        // Compare sectors as normalized strings
        const prevSectors = Array.isArray(prev.sectors) ? prev.sectors : normalizeTagList(prev.sector)
        const sectorsDifferent = JSON.stringify(prevSectors || []) !== JSON.stringify(normalizedSectors || [])
        if (sectorsDifferent) patches.sectors = normalizedSectors

        if (Object.keys(patches).length === 0) return prev

        return {
          ...prev,
          ...patches,
          sector: (patches.sectors || prev.sectors || []).join(', ')
        }
      })

      return
    }

    // Non-foundation sections: initialize only when empty to avoid overwriting
    setFormData((prev: any) => (prev && Object.keys(prev).length > 0 ? prev : sectionData))
  }, [section, identity])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      // Handle nested object fields like 'headquarters.address'
      if (field.includes('.')) {
        const [parentKey, childKey] = field.split('.')
        return {
          ...prev,
          [parentKey]: {
            ...prev[parentKey],
            [childKey]: value
          }
        }
      }
      
      // Handle regular fields
      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleArrayAdd = (field: string, newItem: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...(prev[field] || []), newItem.trim() || '']
    }))
  }

  const handleArrayRemove = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }))
  }

  const updateSectors = (updater: (current: string[]) => string[]) => {
    setFormData((prev: any) => {
      const current: string[] = Array.isArray(prev.sectors) ? prev.sectors : normalizeTagList(prev.sector)
      const next = updater(current)
      return {
        ...prev,
        sectors: next,
        sector: next.join(', ')
      }
    })
  }

  const handleSectorAdd = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setNewSector('')
      return
    }

    updateSectors((current) => {
      if (current.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
        return current
      }
      return [...current, trimmed]
    })
    setNewSector('')
  }

  const handleSectorRemove = (index: number) => {
    updateSectors((current) => current.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const payload = (() => {
      if (section !== 'foundation') {
        return formData
      }

      const sectors = normalizeTagList(
        Array.isArray(formData.sectors) && formData.sectors.length > 0
          ? formData.sectors
          : formData.sector
      )

      return {
        ...formData,
        industry: getIndustryValue(formData.industry),
        sectors,
        sector: sectors.join(', ')
      }
    })()

    onSave(section, payload)
  }

  const renderFoundationForm = () => {
    return (
      <div className="space-y-8">
        {/* Company Identity Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Company Identity</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalStructure">Legal Structure</Label>
              <Select value={formData.legalStructure || 'LLC'} onValueChange={(value) => handleInputChange('legalStructure', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select legal structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="C-Corp">C-Corp</SelectItem>
                  <SelectItem value="S-Corp">S-Corp</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="foundedDate">Founded Date</Label>
            <Input
              id="foundedDate"
              type="date"
              value={formatDateForInput(formData.foundedDate)}
              onChange={(e) => handleInputChange('foundedDate', e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>
        </div>

        {/* Business Classification Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Business Classification</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry || ''} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector-tags">Sector Tags</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(formData.sectors) && formData.sectors.length > 0 ? (
                    formData.sectors.map((sectorTag: string, index: number) => (
                      <Badge
                        key={`${sectorTag}-${index}`}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {sectorTag}
                        <button
                          type="button"
                          onClick={() => handleSectorRemove(index)}
                          className="rounded-full p-0.5 hover:bg-muted"
                          aria-label={`Remove sector ${sectorTag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Add tags that describe your specializations.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="sector-tags"
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault()
                        handleSectorAdd(newSector)
                      }
                    }}
                    placeholder="e.g., Managed IT Services"
                  />
                  <Button type="button" onClick={() => handleSectorAdd(newSector)} disabled={!newSector.trim()}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessModel">Business Model</Label>
              <Select value={formData.businessModel || 'B2B'} onValueChange={(value) => handleInputChange('businessModel', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B</SelectItem>
                  <SelectItem value="B2C">B2C</SelectItem>
                  <SelectItem value="B2B2C">B2B2C</SelectItem>
                  <SelectItem value="Marketplace">Marketplace</SelectItem>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Consulting">Consulting</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Company Metrics Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Company Metrics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyStage">Company Stage</Label>
              <Select value={formData.companyStage || 'Startup'} onValueChange={(value) => handleInputChange('companyStage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Idea">Idea</SelectItem>
                  <SelectItem value="Startup">Startup</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                  <SelectItem value="Mature">Mature</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize">Company Size</Label>
              <Select value={formData.companySize || 'Small (1-5)'} onValueChange={(value) => handleInputChange('companySize', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small (1-5)">Small (1-5)</SelectItem>
                  <SelectItem value="Medium (6-50)">Medium (6-50)</SelectItem>
                  <SelectItem value="Large (51-200)">Large (51-200)</SelectItem>
                  <SelectItem value="Enterprise (200+)">Enterprise (200+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Contact Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website *</Label>
              <Input
                id="website"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@yourcompany.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        {/* Headquarters Address Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Headquarters Address</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headquarters.address">Street Address</Label>
              <Input
                id="headquarters.address"
                value={formData.headquarters?.address || ''}
                onChange={(e) => handleInputChange('headquarters.address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headquarters.city">City</Label>
              <Input
                id="headquarters.city"
                value={formData.headquarters?.city || ''}
                onChange={(e) => handleInputChange('headquarters.city', e.target.value)}
                placeholder="San Francisco"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headquarters.state">State/Province</Label>
              <Input
                id="headquarters.state"
                value={formData.headquarters?.state || ''}
                onChange={(e) => handleInputChange('headquarters.state', e.target.value)}
                placeholder="CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headquarters.zipCode">ZIP/Postal Code</Label>
              <Input
                id="headquarters.zipCode"
                value={formData.headquarters?.zipCode || ''}
                onChange={(e) => handleInputChange('headquarters.zipCode', e.target.value)}
                placeholder="94105"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="headquarters.country">Country</Label>
              <Input
                id="headquarters.country"
                value={formData.headquarters?.country || ''}
                onChange={(e) => handleInputChange('headquarters.country', e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>
        </div>
    </div>
    )
  }

  const renderMissionValuesForm = () => (
    <div className="space-y-8">
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">Need a walkthrough?</p>
          <p className="text-sm text-muted-foreground">
            Click the <span className="inline-flex items-center gap-1 font-medium text-primary"><MessageCircle className="h-3 w-3" />AI Guide</span> button in any section to answer quick questions and let the assistant draft your wording.
          </p>
        </div>
      </div>

      {/* Core Purpose Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Core Purpose
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
          </CardTitle>
          <CardDescription>
            Explain what you do, who you help, and the difference you make today. The AI guide can break this into simple steps.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mission Statement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="missionStatement">Mission Statement *</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setGridMode('mission')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Guide
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Summarize what your company delivers, who benefits, and the immediate value you create.
            </p>
            <Textarea
              id="missionStatement"
              value={formData.missionStatement || ''}
              onChange={(e) => handleInputChange('missionStatement', e.target.value)}
              placeholder="Example: We help remote startups launch reliable products faster by automating their testing and release workflows."
              rows={3}
            />
          </div>

          {/* Vision Statement */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="visionStatement">Vision Statement *</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setGridMode('vision')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Guide
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Describe the future state you are working toward in 3–5 years and the impact you want to make.
            </p>
            <Textarea
              id="visionStatement"
              value={formData.visionStatement || ''}
              onChange={(e) => handleInputChange('visionStatement', e.target.value)}
              placeholder="Example: Become the go-to platform that makes automated releases effortless for every startup engineering team."
              rows={3}
            />
          </div>

          {/* Purpose */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="purpose">Purpose</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setGridMode('purpose')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Guide
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share the deeper motivation behind your company—why it matters beyond revenue or products.
            </p>
            <Textarea
              id="purpose"
              value={formData.purpose || ''}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="Example: We believe every founder deserves the confidence to ship great software without burning out their team."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Core Values Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Core Values *
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Enhanced
            </Badge>
          </CardTitle>
          <CardDescription>
            Capture the non-negotiable principles your team lives by. Use the AI guide if you need help brainstorming examples.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Help for Core Values */}
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setGridMode('values')}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Guide
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Aim for 3–5 values. Give each a short name and explain how it shows up in everyday decisions or behaviors.
          </p>

          <div className="space-y-2">
            {formData.coreValues?.map((value: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={value.name || ''}
                  onChange={(e) => {
                    const newValues = [...formData.coreValues]
                    newValues[index] = { ...value, name: e.target.value }
                    handleInputChange('coreValues', newValues)
                  }}
                  placeholder="Value name (e.g., Customer Obsession)"
                  className="w-48"
                />
                <Textarea
                  value={value.description || ''}
                  onChange={(e) => {
                    const newValues = [...formData.coreValues]
                    newValues[index] = { ...value, description: e.target.value }
                    handleInputChange('coreValues', newValues)
                  }}
                  placeholder="Describe what living this value looks like for your team"
                  rows={2}
                  className="flex-1 h-10 min-h-[40px] resize-none"
                />
                <Select
                  value={value.importance || 'Medium'}
                  onValueChange={(val) => {
                    const newValues = [...formData.coreValues]
                    newValues[index] = { ...value, importance: val }
                    handleInputChange('coreValues', newValues)
                  }}
                >
                  <SelectTrigger className="w-24 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleArrayRemove('coreValues', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => handleArrayAdd('coreValues', '')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Core Value
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Culture Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Culture</CardTitle>
          <CardDescription>Define how your team works and communicates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Work Style</Label>
              <div className="space-y-2">
                {formData.companyCulture?.workStyle?.map((style: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={style}
                      onChange={(e) => {
                        const newStyles = [...(formData.companyCulture?.workStyle || [])]
                        newStyles[index] = e.target.value
                        handleInputChange('companyCulture', {
                          ...formData.companyCulture,
                          workStyle: newStyles
                        })
                      }}
                      placeholder="e.g., Remote-first, Collaborative, Independent"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newStyles = (formData.companyCulture?.workStyle || []).filter((_: any, i: number) => i !== index)
                        handleInputChange('companyCulture', {
                          ...formData.companyCulture,
                          workStyle: newStyles
                        })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newStyles = [...(formData.companyCulture?.workStyle || []), '']
                    handleInputChange('companyCulture', {
                      ...formData.companyCulture,
                      workStyle: newStyles
                    })
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Work Style
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Communication Style</Label>
              <div className="space-y-2">
                {formData.companyCulture?.communicationStyle?.map((style: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={style}
                      onChange={(e) => {
                        const newStyles = [...(formData.companyCulture?.communicationStyle || [])]
                        newStyles[index] = e.target.value
                        handleInputChange('companyCulture', {
                          ...formData.companyCulture,
                          communicationStyle: newStyles
                        })
                      }}
                      placeholder="e.g., Direct, Collaborative, Formal"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newStyles = (formData.companyCulture?.communicationStyle || []).filter((_: any, i: number) => i !== index)
                        handleInputChange('companyCulture', {
                          ...formData.companyCulture,
                          communicationStyle: newStyles
                        })
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    const newStyles = [...(formData.companyCulture?.communicationStyle || []), '']
                    handleInputChange('companyCulture', {
                      ...formData.companyCulture,
                      communicationStyle: newStyles
                    })
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Communication Style
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="decisionMaking">Decision Making</Label>
              <Select 
                value={formData.companyCulture?.decisionMaking || ''} 
                onValueChange={(value) => handleInputChange('companyCulture', {
                  ...formData.companyCulture,
                  decisionMaking: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision making style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Top-down">Top-down</SelectItem>
                  <SelectItem value="Consensus">Consensus</SelectItem>
                  <SelectItem value="Democratic">Democratic</SelectItem>
                  <SelectItem value="Autonomous">Autonomous</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="innovationApproach">Innovation Approach</Label>
              <Select 
                value={formData.companyCulture?.innovationApproach || ''} 
                onValueChange={(value) => handleInputChange('companyCulture', {
                  ...formData.companyCulture,
                  innovationApproach: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select innovation approach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disruptive">Disruptive</SelectItem>
                  <SelectItem value="Incremental">Incremental</SelectItem>
                  <SelectItem value="Experimental">Experimental</SelectItem>
                  <SelectItem value="Customer-driven">Customer-driven</SelectItem>
                  <SelectItem value="Technology-driven">Technology-driven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Personality Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brand Personality</CardTitle>
          <CardDescription>Define the personality traits that represent your brand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {formData.brandPersonality?.map((trait: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={trait.trait || ''}
                  onChange={(e) => {
                    const newTraits = [...formData.brandPersonality]
                    newTraits[index] = { ...trait, trait: e.target.value }
                    handleInputChange('brandPersonality', newTraits)
                  }}
                  placeholder="Trait name"
                  className="w-48"
                />
                <Textarea
                  value={trait.description || ''}
                  onChange={(e) => {
                    const newTraits = [...formData.brandPersonality]
                    newTraits[index] = { ...trait, description: e.target.value }
                    handleInputChange('brandPersonality', newTraits)
                  }}
                  placeholder="Description"
                  rows={1}
                  className="flex-1 h-10 min-h-[40px] resize-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleArrayRemove('brandPersonality', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              onClick={() => handleArrayAdd('brandPersonality', '')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Brand Trait
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Brand Voice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Brand Voice</CardTitle>
          <CardDescription>Define how your brand communicates and expresses itself</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select 
                value={formData.brandVoice?.tone || ''} 
                onValueChange={(value) => handleInputChange('brandVoice', {
                  ...formData.brandVoice,
                  tone: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Friendly">Friendly</SelectItem>
                  <SelectItem value="Authoritative">Authoritative</SelectItem>
                  <SelectItem value="Playful">Playful</SelectItem>
                  <SelectItem value="Inspirational">Inspirational</SelectItem>
                  <SelectItem value="Conversational">Conversational</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select 
                value={formData.brandVoice?.style || ''} 
                onValueChange={(value) => handleInputChange('brandVoice', {
                  ...formData.brandVoice,
                  style: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select communication style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Formal">Formal</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Storytelling">Storytelling</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Voice Examples</Label>
            <div className="space-y-2">
              {formData.brandVoice?.examples?.map((example: string, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Textarea
                    value={example}
                    onChange={(e) => {
                      const newExamples = [...(formData.brandVoice?.examples || [])]
                      newExamples[index] = e.target.value
                      handleInputChange('brandVoice', {
                        ...formData.brandVoice,
                        examples: newExamples
                      })
                    }}
                    placeholder="Example of your brand voice in action"
                    rows={1}
                    className="flex-1 h-10 min-h-[40px] resize-none"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newExamples = (formData.brandVoice?.examples || []).filter((_: any, i: number) => i !== index)
                      handleInputChange('brandVoice', {
                        ...formData.brandVoice,
                        examples: newExamples
                      })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newExamples = [...(formData.brandVoice?.examples || []), '']
                  handleInputChange('brandVoice', {
                    ...formData.brandVoice,
                    examples: newExamples
                  })
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Voice Example
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProductsServicesForm = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="uniqueValueProposition">Unique Value Proposition *</Label>
        <Textarea
          id="uniqueValueProposition"
          value={formData.uniqueValueProposition || ''}
          onChange={(e) => handleInputChange('uniqueValueProposition', e.target.value)}
          placeholder="What makes your product/service unique? Why should customers choose you?"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label>Products/Services</Label>
        <div className="space-y-4">
          {formData.offerings?.map((offering: any, index: number) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Offering {index + 1}</CardTitle>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleArrayRemove('offerings', index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={offering.name || ''}
                      onChange={(e) => {
                        const newOfferings = [...formData.offerings]
                        newOfferings[index] = { ...offering, name: e.target.value }
                        handleInputChange('offerings', newOfferings)
                      }}
                      placeholder="Product/Service name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={offering.type || 'Product'}
                      onValueChange={(value) => {
                        const newOfferings = [...formData.offerings]
                        newOfferings[index] = { ...offering, type: value }
                        handleInputChange('offerings', newOfferings)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Service">Service</SelectItem>
                        <SelectItem value="Solution">Solution</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={offering.description || ''}
                    onChange={(e) => {
                      const newOfferings = [...formData.offerings]
                      newOfferings[index] = { ...offering, description: e.target.value }
                      handleInputChange('offerings', newOfferings)
                    }}
                    placeholder="Describe this offering"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={() => handleArrayAdd('offerings', '')}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product/Service
          </Button>
        </div>
      </div>
    </div>
  )

  const getSectionTitle = () => {
    const titles: Record<IdentitySection, string> = {
      foundation: 'Company Foundation',
      missionVisionValues: 'Mission & Values',
      productsServices: 'Products & Services',
      targetMarket: 'Target Market',
      competitiveLandscape: 'Competitive Landscape',
      businessOperations: 'Business Operations',
      financialContext: 'Financial Context',
      strategicContext: 'Strategic Context'
    }
    return titles[section]
  }

  const renderForm = () => {
    switch (section) {
      case 'foundation':
        return renderFoundationForm()
      case 'missionVisionValues':
        return renderMissionValuesForm()
      case 'productsServices':
        return renderProductsServicesForm()
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Form for {getSectionTitle()} coming soon...</p>
          </div>
        )
    }
  }

  // Handle grid mode for specific sections
  if (gridMode && ['mission', 'vision', 'purpose'].includes(gridMode)) {
    const getCurrentValue = () => {
      switch (gridMode) {
        case 'mission': return formData.missionStatement || ''
        case 'vision': return formData.visionStatement || ''
        case 'purpose': return formData.purpose || ''
        default: return ''
      }
    }

    const handleGridUpdate = (content: string) => {
      switch (gridMode) {
        case 'mission':
          handleInputChange('missionStatement', content)
          break
        case 'vision':
          handleInputChange('visionStatement', content)
          break
        case 'purpose':
          handleInputChange('purpose', content)
          break
      }
    }

    const handleGridSave = () => {
      handleSave()
      setGridMode(null)
    }

    const handleGridCancel = () => {
      setGridMode(null)
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGridCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>
          </div>
        </div>

        <ChatFormGrid
          section={gridMode as 'mission' | 'vision' | 'purpose'}
          context={{
            companyName: identity.foundation?.name,
            industry: identity.foundation?.industry,
            businessModel: identity.foundation?.businessModel
          }}
          currentValue={getCurrentValue()}
          onUpdate={handleGridUpdate}
          onSave={handleGridSave}
          onCancel={handleGridCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderForm()}
        </CardContent>
      </Card>
    </div>
  )
}
