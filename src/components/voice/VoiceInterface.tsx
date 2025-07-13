'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Heart,
  Brain,
  Pause,
  Play,
  Settings
} from 'lucide-react'

interface VoiceInterfaceProps {
  sessionType: 'trinity' | 'skills' | 'career' | 'wellness'
  duration: number
  onEndSession: () => void
  voiceSettings: {
    volume: number
    speed: number
    voice: string
  }
  isListening: boolean
  onToggleListening: () => void
  currentMood: string
  onMoodChange: (mood: string) => void
}

interface ConversationTurn {
  id: string
  type: 'user' | 'coach'
  content: string
  timestamp: Date
  emotion?: string
  insights?: string[]
}

export function VoiceInterface({
  sessionType,
  duration,
  onEndSession,
  voiceSettings,
  isListening,
  onToggleListening,
  currentMood,
  onMoodChange
}: VoiceInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const [isCoachSpeaking, setIsCoachSpeaking] = useState(false)
  const [currentUserInput, setCurrentUserInput] = useState('')
  const [sessionInsights, setSessionInsights] = useState<string[]>([])
  const [emotionalState, setEmotionalState] = useState({
    energy: 0.7,
    engagement: 0.8,
    clarity: 0.6,
    confidence: 0.5
  })

  // Initialize session with greeting
  useEffect(() => {
    const initialGreeting = getSessionGreeting(sessionType)
    setConversation([{
      id: '1',
      type: 'coach',
      content: initialGreeting,
      timestamp: new Date()
    }])
    
    // Simulate coach speaking the greeting
    speakText(initialGreeting)
  }, [sessionType])

  const getSessionGreeting = (type: string): string => {
    const greetings = {
      trinity: "Hello! I'm excited to explore your Trinity with you today. Let's start by getting comfortable. Take a deep breath, and when you're ready, tell me what's been on your mind about your professional purpose lately.",
      skills: "Welcome to your skills coaching session! I'm here to help you think strategically about your professional development. What skill or area of growth has been calling your attention recently?",
      career: "Hi there! Career transitions and decisions can feel overwhelming, but you don't have to navigate them alone. What's the career question or challenge that brought you here today?",
      wellness: "Hello! I'm glad you're taking time to check in on your professional wellness. That's an important practice. How have you been feeling about your work and career lately?"
    }
    return greetings[type as keyof typeof greetings] || greetings.trinity
  }

  const speakText = async (text: string) => {
    if ('speechSynthesis' in window) {
      setIsCoachSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = voiceSettings.speed
      utterance.volume = voiceSettings.volume
      
      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Karen') || 
        voice.name.includes('Moira')
      ) || voices[0]
      
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => setIsCoachSpeaking(false)
      utterance.onerror = () => setIsCoachSpeaking(false)
      
      speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      setIsCoachSpeaking(false)
    }
  }

  const processUserInput = async (input: string) => {
    if (!input.trim()) return

    // Add user message to conversation
    const userTurn: ConversationTurn = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setConversation(prev => [...prev, userTurn])

    // Generate coach response
    const coachResponse = await generateCoachResponse(input, sessionType, conversation)
    
    const coachTurn: ConversationTurn = {
      id: (Date.now() + 1).toString(),
      type: 'coach',
      content: coachResponse.content,
      timestamp: new Date(),
      emotion: coachResponse.emotion,
      insights: coachResponse.insights
    }
    
    setConversation(prev => [...prev, coachTurn])
    
    // Update session insights
    if (coachResponse.insights) {
      setSessionInsights(prev => [...prev, ...(coachResponse.insights || [])])
    }

    // Update emotional state based on conversation
    updateEmotionalState(input, coachResponse.emotion)

    // Speak the coach response
    speakText(coachResponse.content)
  }

  const updateEmotionalState = (userInput: string, coachEmotion?: string) => {
    setEmotionalState(prev => ({
      energy: Math.min(1, prev.energy + (userInput.length > 50 ? 0.1 : 0.05)),
      engagement: Math.min(1, prev.engagement + 0.1),
      clarity: Math.min(1, prev.clarity + (coachEmotion === 'insightful' ? 0.15 : 0.05)),
      confidence: Math.min(1, prev.confidence + (coachEmotion === 'encouraging' ? 0.1 : 0.02))
    }))
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionTypeInfo = (type: string) => {
    const types = {
      trinity: { title: 'Trinity Discovery', color: 'from-quest-400 to-quest-600' },
      skills: { title: 'Skills Coaching', color: 'from-service-400 to-service-600' },
      career: { title: 'Career Navigation', color: 'from-purple-400 to-purple-600' },
      wellness: { title: 'Wellness Check', color: 'from-pink-400 to-pink-600' }
    }
    return types[type as keyof typeof types]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Session Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSessionTypeInfo(sessionType).color} animate-pulse`} />
                  {getSessionTypeInfo(sessionType).title} Session
                </CardTitle>
                <CardDescription>
                  Duration: {formatDuration(duration)} • {conversation.length} exchanges
                </CardDescription>
              </div>
              <Button variant="destructive" onClick={onEndSession}>
                <PhoneOff className="mr-2 h-4 w-4" />
                End Session
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Voice Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Voice Controls */}
            <Card>
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* Listening Indicator */}
                  <div className="relative mx-auto w-32 h-32">
                    <div className={`w-full h-full rounded-full border-8 flex items-center justify-center transition-all duration-300 ${
                      isListening 
                        ? 'border-red-400 bg-red-50 animate-pulse' 
                        : 'border-blue-400 bg-blue-50'
                    }`}>
                      {isListening ? (
                        <Mic className="h-12 w-12 text-red-600" />
                      ) : (
                        <MicOff className="h-12 w-12 text-blue-600" />
                      )}
                    </div>
                    {isListening && (
                      <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isListening ? 'Listening...' : isCoachSpeaking ? 'Coach Speaking...' : 'Ready to Listen'}
                    </h3>
                    <p className="text-slate-600">
                      {isListening 
                        ? 'Speak naturally about your thoughts and feelings'
                        : isCoachSpeaking 
                        ? 'The coach is responding to your input'
                        : 'Tap the microphone when you\'re ready to speak'
                      }
                    </p>
                  </div>

                  {/* Voice Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={isCoachSpeaking ? stopSpeaking : undefined}
                      disabled={!isCoachSpeaking}
                    >
                      {isCoachSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={onToggleListening}
                      disabled={isCoachSpeaking}
                      className={isListening ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="mr-2 h-5 w-5" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <Mic className="mr-2 h-5 w-5" />
                          Start Speaking
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mock user input for demo */}
                  {isListening && (
                    <div className="mt-6 p-4 bg-slate-100 rounded-lg">
                      <input
                        type="text"
                        placeholder="Type your response for demo purposes..."
                        value={currentUserInput}
                        onChange={(e) => setCurrentUserInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && currentUserInput.trim()) {
                            processUserInput(currentUserInput)
                            setCurrentUserInput('')
                            onToggleListening()
                          }
                        }}
                        className="w-full p-2 border rounded text-center"
                        autoFocus
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        Press Enter to send (demo mode - voice recognition coming soon)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversation History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto space-y-4">
                {conversation.map(turn => (
                  <div key={turn.id} className={`flex gap-3 ${turn.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                      turn.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-100 border'
                    }`}>
                      <div className="text-sm">{turn.content}</div>
                      <div className={`text-xs mt-2 ${turn.type === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                        {turn.timestamp.toLocaleTimeString()}
                      </div>
                      {turn.insights && turn.insights.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {turn.insights.map((insight, index) => (
                            <Badge key={index} variant="secondary" className="text-xs mr-1">
                              {insight}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Emotional State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Session State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Energy</span>
                    <span>{Math.round(emotionalState.energy * 100)}%</span>
                  </div>
                  <Progress value={emotionalState.energy * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Engagement</span>
                    <span>{Math.round(emotionalState.engagement * 100)}%</span>
                  </div>
                  <Progress value={emotionalState.engagement * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Clarity</span>
                    <span>{Math.round(emotionalState.clarity * 100)}%</span>
                  </div>
                  <Progress value={emotionalState.clarity * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Confidence</span>
                    <span>{Math.round(emotionalState.confidence * 100)}%</span>
                  </div>
                  <Progress value={emotionalState.confidence * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Session Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionInsights.length === 0 ? (
                  <p className="text-sm text-slate-500">Insights will appear as the conversation progresses</p>
                ) : (
                  <div className="space-y-2">
                    {sessionInsights.map((insight, index) => (
                      <div key={index} className="p-2 bg-purple-50 rounded text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Volume</label>
                  <Progress value={voiceSettings.volume * 100} className="h-2" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Speed</label>
                  <Progress value={(voiceSettings.speed - 0.5) * 66.67} className="h-2" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Style</label>
                  <Badge variant="outline">{voiceSettings.voice}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simulated coach response generator
async function generateCoachResponse(userInput: string, sessionType: string, conversationHistory: ConversationTurn[]) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  const responses = {
    trinity: [
      "That's a really meaningful insight. I can hear the authenticity in what you're sharing. Can you tell me more about what specifically resonates with you about that?",
      "It sounds like you're touching on something important to your sense of purpose. How does this show up in your daily work?",
      "I'm hearing a pattern here that connects to your deeper values. What would it look like if you could express this more fully in your career?"
    ],
    skills: [
      "That's a valuable skill area to focus on. What draws you to developing this particular capability?",
      "I can sense your motivation to grow in this area. What would success look like for you as you develop this skill?",
      "That's an excellent strategic choice. How do you see this skill supporting your broader career goals?"
    ],
    career: [
      "Career transitions can feel overwhelming, but you're asking the right questions. What feels most important to you as you navigate this?",
      "I hear both excitement and uncertainty in what you're sharing. That's completely normal. What would give you more confidence in this direction?",
      "You're being thoughtful about this decision. What would your ideal next chapter look like?"
    ],
    wellness: [
      "Thank you for being honest about how you're feeling. That kind of self-awareness is really valuable. What would feel most supportive right now?",
      "It takes courage to acknowledge when things feel challenging. You're not alone in this. What has helped you through difficult periods before?",
      "I appreciate you taking time to check in with yourself. What would better balance look like for you?"
    ]
  }

  const sessionResponses = responses[sessionType as keyof typeof responses] || responses.trinity
  const randomResponse = sessionResponses[Math.floor(Math.random() * sessionResponses.length)]

  // Generate insights based on user input
  const insights = []
  if (userInput.toLowerCase().includes('passion') || userInput.toLowerCase().includes('love')) {
    insights.push('Values exploration')
  }
  if (userInput.toLowerCase().includes('challenge') || userInput.toLowerCase().includes('difficult')) {
    insights.push('Growth opportunity')
  }
  if (userInput.toLowerCase().includes('team') || userInput.toLowerCase().includes('people')) {
    insights.push('Interpersonal strength')
  }

  return {
    content: randomResponse,
    emotion: ['encouraging', 'empathic', 'insightful', 'supportive'][Math.floor(Math.random() * 4)],
    insights: insights.length > 0 ? insights : undefined
  }
}