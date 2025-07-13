'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Send, ArrowLeft, Lightbulb, Target, Shield, Bot, User } from 'lucide-react'

interface TrinityData {
  quest: string
  service: string
  pledge: string
}

type TrinityStep = 'intro' | 'quest' | 'service' | 'pledge' | 'integration' | 'complete'

interface TrinityCoachProps {
  currentStep: string
  trinityData: TrinityData
  onUpdateTrinity: (field: keyof TrinityData, value: string) => void
  onStepChange: (step: TrinityStep) => void
  onExitCoaching: () => void
}

interface Message {
  id: string
  type: 'user' | 'coach'
  content: string
  timestamp: Date
  trinityElement?: 'quest' | 'service' | 'pledge'
}

export function TrinityCoach({ 
  currentStep, 
  trinityData, 
  onUpdateTrinity, 
  onStepChange, 
  onExitCoaching 
}: TrinityCoachProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize with coaching greeting based on current step
    const initialMessage = getInitialCoachingMessage(currentStep)
    setMessages([{
      id: '1',
      type: 'coach',
      content: initialMessage,
      timestamp: new Date()
    }])
  }, [currentStep])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getInitialCoachingMessage = (step: string): string => {
    const greetings = {
      intro: "Welcome! I'm your Trinity Coach. I'm here to guide you through discovering your authentic professional identity. What brings you to this journey today?",
      quest: "Let's explore your Quest - what truly drives you at work. I'd love to understand what makes you feel most alive and purposeful in your professional life. What comes to mind when you think about your deepest motivation?",
      service: "Now let's dive into your Service - how you uniquely contribute to others. Think about the moments when you feel most valuable at work. What do you do that creates meaningful impact for others?",
      pledge: "Finally, let's articulate your Pledge - what you commit to upholding. This is about the promises your work makes to the world. What standards and commitments define your professional integrity?",
      integration: "Beautiful work! Now let's see how your Quest, Service, and Pledge work together. How do you see these three elements supporting and reinforcing each other in your professional life?"
    }
    return greetings[step as keyof typeof greetings] || greetings.intro
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsProcessing(true)

    try {
      // Simulate AI coaching response (replace with actual API call)
      const coachResponse = await generateCoachingResponse(inputMessage, currentStep, trinityData, messages)
      
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: coachResponse.content,
        timestamp: new Date(),
        trinityElement: coachResponse.trinityElement
      }

      setMessages(prev => [...prev, coachMessage])

      // Update Trinity data if coach extracted insights
      if (coachResponse.trinityUpdate) {
        const { field, value } = coachResponse.trinityUpdate
        onUpdateTrinity(field, value)
      }

    } catch (error) {
      console.error('Error generating coaching response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: "I apologize, but I'm having trouble processing your response right now. Could you try rephrasing that?",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    setIsListening(!isListening)
    // Implement voice input logic here
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trinity AI Coach</h1>
          <p className="text-slate-600">
            Discovering your {currentStep === 'quest' ? 'Quest' : currentStep === 'service' ? 'Service' : currentStep === 'pledge' ? 'Pledge' : 'Trinity'}
          </p>
        </div>
        <Button variant="outline" onClick={onExitCoaching}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Exit Coaching
        </Button>
      </div>

      {/* Current Trinity Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Your Trinity Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-3 rounded border-2 ${trinityData.quest ? 'trinity-quest' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-quest-600" />
                <span className="font-medium text-sm">Quest</span>
              </div>
              <p className="text-xs text-slate-600">
                {trinityData.quest || 'Not yet discovered'}
              </p>
            </div>
            <div className={`p-3 rounded border-2 ${trinityData.service ? 'trinity-service' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-service-600" />
                <span className="font-medium text-sm">Service</span>
              </div>
              <p className="text-xs text-slate-600">
                {trinityData.service || 'Not yet defined'}
              </p>
            </div>
            <div className={`p-3 rounded border-2 ${trinityData.pledge ? 'trinity-pledge' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-pledge-600" />
                <span className="font-medium text-sm">Pledge</span>
              </div>
              <p className="text-xs text-slate-600">
                {trinityData.pledge || 'Not yet articulated'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`coaching-message ${message.type}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'coach' ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {message.type === 'coach' ? (
                      <Bot className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {message.type === 'coach' ? 'Trinity Coach' : 'You'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.trinityElement && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          message.trinityElement === 'quest' ? 'bg-quest-100 text-quest-700' :
                          message.trinityElement === 'service' ? 'bg-service-100 text-service-700' :
                          'bg-pledge-100 text-pledge-700'
                        }`}>
                          {message.trinityElement}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="coaching-message coach">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Trinity Coach</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-slate-500">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Textarea
                placeholder="Share your thoughts about your professional identity..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={toggleVoiceInput}
                variant={isListening ? "default" : "outline"}
                size="icon"
                disabled={isProcessing}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Simulated AI coaching response generator
async function generateCoachingResponse(
  userMessage: string, 
  currentStep: string, 
  trinityData: any, 
  conversationHistory: Message[]
) {
  // This would be replaced with actual AI API call
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const responses = {
    quest: [
      "That's a beautiful insight! I can hear the passion in your words. Can you tell me more about what specifically energizes you about that?",
      "It sounds like you're touching on something really important to you. How does this show up in your day-to-day work?",
      "I'm sensing there's something deeper here. What would happen if you could spend more time in that space?"
    ],
    service: [
      "That's a powerful way to serve others. How do you see this unique contribution developing as you grow in your career?",
      "It sounds like you have a real gift for this. What feedback have you received from others about this strength?",
      "I can see how meaningful this is to you. How does this service connect to your deeper sense of purpose?"
    ],
    pledge: [
      "That's a meaningful commitment. How would you know if you're living up to this pledge in your daily work?",
      "I appreciate the thoughtfulness in that pledge. What would it look like to hold yourself accountable to this?",
      "That sounds like a promise that would make a real difference. How does this commitment feel when you say it out loud?"
    ]
  }

  const stepResponses = responses[currentStep as keyof typeof responses] || responses.quest
  const randomResponse = stepResponses[Math.floor(Math.random() * stepResponses.length)]

  return {
    content: randomResponse,
    trinityElement: currentStep as 'quest' | 'service' | 'pledge',
    trinityUpdate: Math.random() > 0.7 ? {
      field: currentStep as 'quest' | 'service' | 'pledge',
      value: userMessage
    } : undefined
  }
}