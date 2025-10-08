import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Save, ArrowLeft, Sparkles } from "lucide-react"
import { ChatAIAssistant } from "@/components/ai/chat-ai-assistant"
import { ChatFormGrid } from "@/components/ai/chat-form-grid"
import type { BusinessIdentity, IdentitySection } from '@/lib/identity/types'

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

  useEffect(() => {
    // Initialize form data with current identity data
    setFormData((identity as any)[section] || {})
  }, [section, identity])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
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

  const handleSave = () => {
    onSave(section, formData)
  }

  const renderFoundationForm = () => (
    <div className="space-y-6">
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
              <SelectItem value="Corporation">Corporation</SelectItem>
              <SelectItem value="Partnership">Partnership</SelectItem>
              <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Input
            id="industry"
            value={formData.industry || ''}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            placeholder="e.g., Technology, Healthcare, Finance"
          />
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
  )

  const renderMissionValuesForm = () => (
    <div className="space-y-8">
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
          <CardDescription>Define your company's fundamental purpose and direction</CardDescription>
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
                AI Chat
              </Button>
            </div>
            <Textarea
              id="missionStatement"
              value={formData.missionStatement || ''}
              onChange={(e) => handleInputChange('missionStatement', e.target.value)}
              placeholder="What is your company's mission? What do you do and why do you exist?"
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
                AI Chat
              </Button>
            </div>
            <Textarea
              id="visionStatement"
              value={formData.visionStatement || ''}
              onChange={(e) => handleInputChange('visionStatement', e.target.value)}
              placeholder="Where is your company heading? What is your long-term vision?"
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
                AI Chat
              </Button>
            </div>
            <Textarea
              id="purpose"
              value={formData.purpose || ''}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="Why does your company exist? What problem are you solving?"
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
          <CardDescription>Define the principles that guide your company's decisions and actions</CardDescription>
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
              AI Chat
            </Button>
          </div>
          

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
                  placeholder="Value name"
                  className="flex-1"
                />
                <Textarea
                  value={value.description || ''}
                  onChange={(e) => {
                    const newValues = [...formData.coreValues]
                    newValues[index] = { ...value, description: e.target.value }
                    handleInputChange('coreValues', newValues)
                  }}
                  placeholder="Description"
                  rows={1}
                  className="flex-1"
                />
                <Select
                  value={value.importance || 'Medium'}
                  onValueChange={(val) => {
                    const newValues = [...formData.coreValues]
                    newValues[index] = { ...value, importance: val }
                    handleInputChange('coreValues', newValues)
                  }}
                >
                  <SelectTrigger className="w-24">
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
                  className="flex-1"
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
                  className="flex-1"
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
                    className="flex-1"
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{getSectionTitle()}</h2>
            <p className="text-muted-foreground">Chat with AI to generate your {getSectionTitle().toLowerCase()}</p>
          </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{getSectionTitle()}</h2>
          <p className="text-muted-foreground">Edit your {getSectionTitle().toLowerCase()} information</p>
        </div>
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
