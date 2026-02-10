import React, { useState } from 'react'
import { Button } from "@/shared/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/Card"
import { Textarea } from "@/shared/components/ui/Textarea"
import { Badge } from "@/shared/components/ui/Badge"
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Check, 
  X, 
  Loader2,
  Lightbulb,
  Target,
  Heart,
  Users,
  MessageSquare
} from "lucide-react"

interface AIAssistantProps {
  section: 'mission' | 'vision' | 'purpose' | 'values' | 'culture' | 'brand'
  currentValue?: string
  context?: {
    companyName?: string
    industry?: string
    businessModel?: string
    existingValues?: string[]
  }
  onGenerate: (content: string) => void
  onAccept: (content: string) => void
  onReject: () => void
}

export function AIAssistant({ 
  section, 
  currentValue, 
  context, 
  onGenerate, 
  onAccept, 
  onReject 
}: AIAssistantProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const getSectionConfig = () => {
    const configs = {
      mission: {
        title: 'Mission Statement',
        description: 'Generate a compelling mission statement that defines what your company does and why it exists',
        icon: Target,
        prompts: [
          'What problem does your company solve?',
          'Who are your customers?',
          'What makes you unique?',
          'What impact do you want to make?'
        ]
      },
      vision: {
        title: 'Vision Statement',
        description: 'Create a vision statement that describes your company\'s future aspirations',
        icon: Lightbulb,
        prompts: [
          'Where do you see your company in 5-10 years?',
          'What change do you want to create in the world?',
          'What would success look like?',
          'What legacy do you want to leave?'
        ]
      },
      purpose: {
        title: 'Purpose',
        description: 'Define your company\'s fundamental reason for existing',
        icon: Heart,
        prompts: [
          'Why does your company exist?',
          'What drives you every day?',
          'What would you do even if you weren\'t paid?',
          'What cause are you passionate about?'
        ]
      },
      values: {
        title: 'Core Values',
        description: 'Identify the principles that guide your company\'s decisions and actions',
        icon: Heart,
        prompts: [
          'What principles guide your decisions?',
          'How do you treat your customers?',
          'What behavior do you reward?',
          'What would you never compromise on?'
        ]
      },
      culture: {
        title: 'Company Culture',
        description: 'Define how your team works and communicates',
        icon: Users,
        prompts: [
          'How does your team prefer to work?',
          'What communication style works best?',
          'How do you make decisions?',
          'What environment helps you thrive?'
        ]
      },
      brand: {
        title: 'Brand Personality',
        description: 'Define the personality traits that represent your brand',
        icon: MessageSquare,
        prompts: [
          'How do you want to be perceived?',
          'What tone do you use with customers?',
          'What personality traits describe your brand?',
          'How do you want people to feel about your company?'
        ]
      }
    }
    return configs[section]
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setShowSuggestions(true)
    
    // Simulate AI generation - replace with actual AI API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const config = getSectionConfig()
    const mockContent = generateMockContent(section, context)
    setGeneratedContent(mockContent)
    setIsGenerating(false)
  }

  const generateMockContent = (section: string, context?: any) => {
    const companyName = context?.companyName || 'your company'
    const industry = context?.industry || 'your industry'
    
    const mockContents = {
      mission: `To revolutionize ${industry} by providing innovative solutions that empower businesses to achieve their full potential, while maintaining the highest standards of quality and customer satisfaction.`,
      vision: `To become the leading ${industry} company that transforms how businesses operate, creating a world where every organization can thrive through cutting-edge technology and exceptional service.`,
      purpose: `We exist to solve complex challenges in ${industry}, making a meaningful difference in the lives of our customers and communities through innovative solutions and unwavering commitment to excellence.`,
      values: `Innovation, Integrity, Customer-Centricity, Excellence, Collaboration`,
      culture: `We foster a collaborative, remote-first environment where transparency, continuous learning, and mutual respect drive our success.`,
      brand: `Professional yet approachable, innovative yet reliable, ambitious yet humble`
    }
    
    return mockContents[section] || 'Generated content will appear here...'
  }

  const config = getSectionConfig()
  const Icon = config.icon

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Assistant</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        <CardDescription>
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Questions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Help me understand:</h4>
          <div className="grid grid-cols-2 gap-2">
            {config.prompts.map((prompt, index) => (
              <div key={index} className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                {prompt}
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate {config.title}
              </>
            )}
          </Button>
        </div>

        {/* Generated Content */}
        {showSuggestions && generatedContent && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Suggestion:</span>
            </div>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="AI generated content will appear here..."
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => onAccept(generatedContent)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept & Use
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  onGenerate()
                  setShowSuggestions(false)
                }}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowSuggestions(false)
                  onReject()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Current Value Display */}
        {currentValue && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current:</span>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
              {currentValue}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
