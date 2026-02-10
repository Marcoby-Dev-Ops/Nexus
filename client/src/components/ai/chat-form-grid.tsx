import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/shared/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/Card"
import { Input } from "@/shared/components/ui/Input"
import { Badge } from "@/shared/components/ui/Badge"
import { ScrollArea } from "@/shared/components/ui/ScrollArea"
import { Textarea } from "@/shared/components/ui/Textarea"
import { Label } from "@/shared/components/ui/Label"
import { ConversationContextManager } from '@/lib/ai/conversation-context-manager'
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Sparkles,
  Wand2,
  Check,
  X,
  Loader2,
  RotateCcw,
  Eye,
  Edit3,
  Brain
} from "lucide-react"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatFormGridProps {
  section: 'mission' | 'vision' | 'purpose' | 'values' | 'culture' | 'brand'
  context?: {
    companyName?: string
    industry?: string
    businessModel?: string
    existingValues?: string[]
  }
  currentValue?: string
  onUpdate: (content: string) => void
  onSave: () => void
  onCancel: () => void
}

export function ChatFormGrid({
  section,
  context,
  currentValue,
  onUpdate,
  onSave,
  onCancel
}: ChatFormGridProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [contextManager] = useState(() => new ConversationContextManager())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage = getWelcomeMessage(section, context)
    setMessages([{
      id: '1',
      type: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }])
  }, [section, context])

  const getWelcomeMessage = (section: string, context?: any) => {
    const companyName = context?.companyName || 'your company'
    const industry = context?.industry || 'your industry'

    // Get stored context for this section
    const storedContext = contextManager.getContextSummary(section)
    const relevantQuestions = contextManager.getRelevantQuestions(section)

    const baseMessages = {
      mission: `Hi! I'm here to help you craft a compelling mission statement for ${companyName}.`,
      vision: `Hello! I'd love to help you create a powerful vision statement for ${companyName}.`,
      purpose: `Hi there! Let's define the core purpose of ${companyName}.`,
      values: `Hello! I'm excited to help you identify the core values that guide ${companyName}.`,
      culture: `Hi! Let's define the culture that makes ${companyName} unique.`,
      brand: `Hello! I'm here to help you define ${companyName}'s brand personality.`
    }

    let welcomeMessage = baseMessages[section] || 'Hi! I\'m here to help you with this section.'

    // Add stored context if available
    if (storedContext) {
      welcomeMessage += `\n\nI remember our previous conversations about this topic. ${storedContext}`
    }

    // Add relevant questions
    if (relevantQuestions.length > 0) {
      welcomeMessage += `\n\nLet's continue exploring: ${relevantQuestions[0]}`
    } else {
      // Default questions if no relevant ones
      const defaultQuestions = {
        mission: `What does your company do? What problem are you solving in the ${industry} industry?`,
        vision: `Where do you see ${companyName} in 5-10 years? What impact do you want to make?`,
        purpose: `Why does your company exist? What drives you to do what you do every day?`,
        values: `What principles are most important to you? How do you want your team to behave?`,
        culture: `How does your team prefer to work? What kind of environment helps you all thrive?`,
        brand: `How do you want people to perceive your company? What tone do you use with customers?`
      }
      welcomeMessage += `\n\nLet's start with: ${defaultQuestions[section] || 'What would you like to explore?'}`
    }

    return welcomeMessage
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])

    // Store the user's answer as insight
    const lastAssistantMessage = messages.filter(m => m.type === 'assistant').pop()
    if (lastAssistantMessage) {
      // Extract question from the last assistant message
      const question = extractQuestionFromMessage(lastAssistantMessage.content)
      if (question) {
        contextManager.addAnswer(section, question, inputValue, 'Medium')
      }
    }

    setInputValue('')
    setIsTyping(true)

    try {
      // Send message to OpenClaw through our backend
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || '' // Get the auth token
        },
        body: JSON.stringify({
          message: inputValue,
          context: {
            section,
            ...context,
            messageHistory: messages,
            insights: contextManager.getInsights(section)
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: data.data.conversationId || (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.data.reply,
        timestamp: new Date(data.data.timestamp)
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Extract question from assistant message
  const extractQuestionFromMessage = (message: string): string | null => {
    // Look for question patterns in the message
    const questionPatterns = [
      /What does your company do\?/,
      /What problem are you solving\?/,
      /Who are your main customers\?/,
      /What makes you unique\?/,
      /Where do you see your company in/,
      /What impact do you want to make\?/,
      /Why does your company exist\?/,
      /What drives you every day\?/,
      /What principles are most important/,
      /How do you want your team to behave\?/,
      /How does your team prefer to work\?/,
      /How do you want people to perceive/
    ]

    for (const pattern of questionPatterns) {
      const match = message.match(pattern)
      if (match) {
        return match[0]
      }
    }

    return null
  }

  // generateAIResponse removed — OpenClaw handles all AI responses via /api/chat/message


  const handleGenerateFinal = async () => {
    setIsTyping(true)

    try {
      // Build a prompt from conversation history for OpenClaw to generate final content
      const conversationSummary = messages
        .map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')

      const generatePrompt = `Based on our conversation below, generate a concise, polished ${getSectionTitle().toLowerCase()} for ${context?.companyName || 'the company'}.\n\nConversation:\n${conversationSummary}\n\nGenerate ONLY the final ${getSectionTitle().toLowerCase()} text, nothing else.`

      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token') || ''
        },
        body: JSON.stringify({
          message: generatePrompt,
          context: { section, ...context }
        })
      })

      if (!response.ok) throw new Error('Failed to generate content')

      const data = await response.json()
      const finalContent = data.data?.reply || 'Failed to generate content. Please try again.'

      setGeneratedContent(finalContent)
      setShowGeneratedContent(true)
      onUpdate(finalContent)
    } catch (error) {
      console.error('Failed to generate final content:', error)
      setGeneratedContent('Failed to generate content. Please try again.')
      setShowGeneratedContent(true)
    } finally {
      setIsTyping(false)
    }
  }


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const resetChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: getWelcomeMessage(section, context),
      timestamp: new Date()
    }])
    setShowGeneratedContent(false)
    setGeneratedContent('')
  }

  const getSectionTitle = () => {
    const titles = {
      mission: 'Mission Statement',
      vision: 'Vision Statement',
      purpose: 'Purpose',
      values: 'Core Values',
      culture: 'Company Culture',
      brand: 'Brand Personality'
    }
    return titles[section] || 'Content'
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
      {/* Chat Column */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Chat Assistant</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
              {contextManager.getInsights(section) && (
                <Badge variant="outline" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  Context Aware
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={resetChat}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          <CardDescription>
            Chat with AI to help generate your {getSectionTitle().toLowerCase()}
            {contextManager.getInsights(section) && (
              <span className="text-primary"> • Using previous conversation insights</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Chat Messages */}
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'assistant' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                      }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.type === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Generate Final Content */}
          {messages.length > 2 && !showGeneratedContent && (
            <div className="flex justify-center">
              <Button onClick={handleGenerateFinal} disabled={isTyping}>
                {isTyping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Final Content
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Column */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{getSectionTitle()}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <Eye className="h-4 w-4 mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
            </div>
          </div>
          <CardDescription>
            Your {getSectionTitle().toLowerCase()} will appear here as you chat with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Generated Content Display */}
          {showGeneratedContent && generatedContent && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Generated Content:</span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{generatedContent}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onUpdate(generatedContent)
                    setShowGeneratedContent(false)
                  }}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Accept & Use
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateFinal}
                  className="flex-1"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Form Field */}
          <div className="flex-1 flex flex-col space-y-2">
            <Label htmlFor="content">{getSectionTitle()}</Label>
            <Textarea
              id="content"
              value={currentValue || ''}
              onChange={(e) => onUpdate(e.target.value)}
              placeholder={`Enter your ${getSectionTitle().toLowerCase()}...`}
              className="flex-1 min-h-[200px]"
              readOnly={!isEditing}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onSave} className="flex-1">
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
