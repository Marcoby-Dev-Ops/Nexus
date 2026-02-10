import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/shared/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/Card"
import { Input } from "@/shared/components/ui/Input"
import { ScrollArea } from "@/shared/components/ui/ScrollArea"
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Mic,
  MicOff,
  Upload,
  Volume2,
  VolumeX
} from "lucide-react"

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatAIAssistantProps {
  // Add any necessary props here
}

export function ChatAIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [showGeneratedContent, setShowGeneratedContent] = useState(false)
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
    
    const welcomeMessages = {
      mission: `Hi! I'm here to help you craft a compelling mission statement for ${companyName}. 

Let's start with the basics: What does your company do? What problem are you solving in the ${industry} industry?`,
      
      vision: `Hello! I'd love to help you create a powerful vision statement for ${companyName}.

Let's think about the future: Where do you see ${companyName} in 5-10 years? What impact do you want to make?`,
      
      purpose: `Hi there! Let's define the core purpose of ${companyName}.

I'd like to understand: Why does your company exist? What drives you to do what you do every day?`,
      
      values: `Hello! I'm excited to help you identify the core values that guide ${companyName}.

Let's start with: What principles are most important to you? How do you want your team to behave?`,
      
      culture: `Hi! Let's define the culture that makes ${companyName} unique.

Tell me: How does your team prefer to work? What kind of environment helps you all thrive?`,
      
      brand: `Hello! I'm here to help you define ${companyName}'s brand personality.

Let's explore: How do you want people to perceive your company? What tone do you use with customers?`
    }
    
    return welcomeMessages[section] || 'Hi! I\'m here to help you with this section. What would you like to explore?'
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
            messageHistory: messages
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

  const generateAIResponse = (section: string, userInput: string, messageHistory: Message[], context?: any) => {
    // This is a mock AI response generator - replace with actual AI API
    const responses = {
      mission: [
        "That's a great start! Now, who are your main customers? What makes them choose you over competitors?",
        "Interesting! What specific problem does this solve for your customers? How does it make their lives better?",
        "Perfect! Now let's think about your unique approach. What sets your solution apart from others in the market?",
        "Excellent! Based on what you've told me, I can help you craft a mission statement. Would you like me to generate one now?"
      ],
      vision: [
        "That's inspiring! What kind of change do you want to create in the world? How will the industry be different because of your company?",
        "Great vision! What would success look like for your company? How would you measure that you've achieved your vision?",
        "Wonderful! What legacy do you want to leave? How do you want to be remembered in your industry?",
        "Fantastic! I have enough information to create a vision statement. Should I generate one for you?"
      ],
      purpose: [
        "That's powerful! What drives you personally to work on this? What would you do even if you weren't getting paid?",
        "I love that! What cause or mission are you most passionate about? How does your work contribute to something bigger?",
        "That's meaningful! What impact do you hope to have on your customers' lives? How do you want to make a difference?",
        "Perfect! I think I understand your purpose now. Would you like me to help you articulate it clearly?"
      ],
      values: [
        "Those are important values! How do these values show up in your daily work? Can you give me an example?",
        "Great values! How do you ensure your team lives these values? What behaviors do you reward?",
        "Excellent! What would you never compromise on, even if it meant losing business?",
        "Wonderful! I have a good sense of your values. Should I help you refine and articulate them?"
      ]
    }

    const sectionResponses = responses[section] || responses.mission
    const randomResponse = sectionResponses[Math.floor(Math.random() * sectionResponses.length)]
    
    return randomResponse
  }

  const handleGenerateFinal = async () => {
    setIsTyping(true)
    
    // Simulate final generation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const finalContent = generateFinalContent(section, messages, context)
    setGeneratedContent(finalContent)
    setShowGeneratedContent(true)
    setIsTyping(false)
  }

  const generateFinalContent = (section: string, messageHistory: Message[], context?: any) => {
    const companyName = context?.companyName || 'your company'
    const industry = context?.industry || 'your industry'
    
    const finalContents = {
      mission: `To revolutionize ${industry} by providing innovative solutions that empower businesses to achieve their full potential, while maintaining the highest standards of quality and customer satisfaction.`,
      vision: `To become the leading ${industry} company that transforms how businesses operate, creating a world where every organization can thrive through cutting-edge technology and exceptional service.`,
      purpose: `We exist to solve complex challenges in ${industry}, making a meaningful difference in the lives of our customers and communities through innovative solutions and unwavering commitment to excellence.`,
      values: `Innovation, Integrity, Customer-Centricity, Excellence, Collaboration`,
      culture: `We foster a collaborative, remote-first environment where transparency, continuous learning, and mutual respect drive our success.`,
      brand: `Professional yet approachable, innovative yet reliable, ambitious yet humble`
    }
    
    return finalContents[section] || 'Generated content based on our conversation...'
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

  return (
    <Card className="h-[calc(100vh-8rem)] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Marcoby Assistant</CardTitle>
        </div>
        <CardDescription>
          How can I help you today?
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Chat Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
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
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.type === 'user'
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
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2 pt-2">
          <div className="flex-1 flex gap-2 items-center">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              title={isVoiceEnabled ? "Disable voice responses" : "Enable voice responses"}
            >
              {isVoiceEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? "text-red-500" : ""}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <div className="relative">
              <input
                type="file"
                className="hidden"
                id="file-upload"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.txt"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => document.getElementById('file-upload')?.click()}
                title="Upload file"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
