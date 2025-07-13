'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVoice } from '@humeai/voice-react'
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
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface HumeVoiceInterfaceProps {
  sessionType: 'trinity' | 'skills' | 'career' | 'wellness'
  onEndSession: () => void
}

interface ConversationTurn {
  id: string
  type: 'user' | 'coach'
  content: string
  timestamp: Date
  emotion?: string
  insights?: string[]
}

export function HumeVoiceInterface({
  sessionType,
  onEndSession
}: HumeVoiceInterfaceProps) {
  const { connect, disconnect, status, messages } = useVoice()
  const [conversation, setConversation] = useState<ConversationTurn[]>([])
  const [sessionInsights, setSessionInsights] = useState<string[]>([])
  const [emotionalState, setEmotionalState] = useState({
    energy: 0.7,
    engagement: 0.8,
    clarity: 0.6,
    confidence: 0.5
  })
  const [sessionDuration, setSessionDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Track session duration
  useEffect(() => {
    if (status.value === 'connected') {
      const interval = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [status.value])

  // Process Hume messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return

    if (lastMessage.type === 'user_message' || lastMessage.type === 'assistant_message') {
      const turn: ConversationTurn = {
        id: Date.now().toString(),
        type: lastMessage.type === 'user_message' ? 'user' : 'coach',
        content: lastMessage.message.content || '',
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, turn])
      
      // Update emotional state based on conversation
      if (lastMessage.type === 'user_message') {
        updateEmotionalState(lastMessage.message.content || '')
      }
    }
    
    // Handle errors
    if (lastMessage.type === 'error') {
      console.error('Hume error:', lastMessage)
    }
  }, [messages])
  
  // Auto-reconnect on disconnect
  useEffect(() => {
    if (status.value === 'error') {
      console.log('Connection error detected, will not auto-reconnect to prevent loops')
    }
  }, [status.value])

  const updateEmotionalState = (userInput: string) => {
    setEmotionalState(prev => ({
      energy: Math.min(1, prev.energy + (userInput.length > 50 ? 0.1 : 0.05)),
      engagement: Math.min(1, prev.engagement + 0.1),
      clarity: Math.min(1, prev.clarity + 0.05),
      confidence: Math.min(1, prev.confidence + 0.02)
    }))
  }

  const handleConnect = async () => {
    try {
      await connect()
    } catch (error) {
      console.error('Failed to connect:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      onEndSession()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
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
    return types[type as keyof typeof types] || types.trinity
  }

  const getStatusColor = () => {
    switch (status.value) {
      case 'connected': return 'text-green-600'
      case 'connecting': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-slate-600'
    }
  }

  const getStatusIcon = () => {
    switch (status.value) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return null
    }
  }

  const isConnected = status.value === 'connected'
  const isConnecting = status.value === 'connecting'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Session Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getSessionTypeInfo(sessionType).color} ${isConnected ? 'animate-pulse' : ''}`} />
                  {getSessionTypeInfo(sessionType).title} Session
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <span className={`flex items-center gap-1 ${getStatusColor()}`}>
                    {getStatusIcon()}
                    {status.value}
                  </span>
                  {isConnected && (
                    <>
                      <span>•</span>
                      <span>Duration: {formatDuration(sessionDuration)}</span>
                      <span>•</span>
                      <span>{conversation.length} exchanges</span>
                    </>
                  )}
                </CardDescription>
              </div>
              <Button 
                variant="destructive" 
                onClick={handleDisconnect}
                disabled={!isConnected}
              >
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
                      isConnected 
                        ? 'border-green-400 bg-green-50' 
                        : isConnecting
                        ? 'border-yellow-400 bg-yellow-50 animate-pulse'
                        : 'border-slate-400 bg-slate-50'
                    }`}>
                      <Mic className={`h-12 w-12 ${
                        isConnected ? 'text-green-600' : 
                        isConnecting ? 'text-yellow-600' : 
                        'text-slate-600'
                      }`} />
                    </div>
                    {isConnected && (
                      <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping" />
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      {isConnected ? 'Session Active' : 
                       isConnecting ? 'Connecting...' : 
                       'Ready to Start'}
                    </h3>
                    <p className="text-slate-600">
                      {isConnected 
                        ? 'Speak naturally - I\'m listening and will respond'
                        : isConnecting 
                        ? 'Setting up your voice session...'
                        : 'Click below to start your coaching session'
                      }
                    </p>
                  </div>

                  {/* Voice Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {!isConnected && !isConnecting && (
                      <Button
                        size="lg"
                        onClick={handleConnect}
                      >
                        <Mic className="mr-2 h-5 w-5" />
                        Start Voice Session
                      </Button>
                    )}
                    
                    {isConnected && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsMuted(!isMuted)}
                        >
                          {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Connection Error */}
                  {status.value === 'error' && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">
                        Connection failed. Please check your settings and try again.
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
                {conversation.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    Start your session to begin the conversation
                  </p>
                ) : (
                  conversation.map(turn => (
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
                      </div>
                    </div>
                  ))
                )}
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

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Voice Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>• Speak naturally and at your own pace</p>
                <p>• Feel free to pause and think</p>
                <p>• You can interrupt anytime</p>
                <p>• Share as much or as little as you want</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}