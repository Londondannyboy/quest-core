'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings,
  Heart,
  Brain,
  Target,
  Lightbulb,
  Shield
} from 'lucide-react'
import { VoiceInterface } from '@/components/voice/VoiceInterface'

interface VoiceSession {
  id: string
  type: 'trinity' | 'skills' | 'career' | 'wellness'
  duration: number
  insights: string[]
  mood: 'positive' | 'neutral' | 'contemplative' | 'energized'
  timestamp: Date
}

export default function VoiceCoachPage() {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionType, setSessionType] = useState<'trinity' | 'skills' | 'career' | 'wellness'>('trinity')
  const [isListening, setIsListening] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentMood, setCurrentMood] = useState<string>('calm')
  const [voiceSettings, setVoiceSettings] = useState({
    volume: 0.8,
    speed: 1.0,
    voice: 'empathic'
  })

  // Sample session history
  const [recentSessions] = useState<VoiceSession[]>([
    {
      id: '1',
      type: 'trinity',
      duration: 1200, // 20 minutes
      insights: ['Discovered passion for mentoring', 'Values alignment with current role'],
      mood: 'contemplative',
      timestamp: new Date(Date.now() - 86400000) // Yesterday
    },
    {
      id: '2',
      type: 'skills',
      duration: 900, // 15 minutes
      insights: ['Need to develop public speaking', 'Strong analytical capabilities identified'],
      mood: 'positive',
      timestamp: new Date(Date.now() - 172800000) // 2 days ago
    }
  ])

  const sessionInterval = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isSessionActive) {
      sessionInterval.current = setInterval(() => {
        setSessionDuration(prev => prev + 1)
      }, 1000)
    } else {
      if (sessionInterval.current) {
        clearInterval(sessionInterval.current)
      }
    }

    return () => {
      if (sessionInterval.current) {
        clearInterval(sessionInterval.current)
      }
    }
  }, [isSessionActive])

  const startSession = () => {
    setIsSessionActive(true)
    setSessionDuration(0)
    setCurrentMood('engaged')
  }

  const endSession = () => {
    setIsSessionActive(false)
    setIsListening(false)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionTypeInfo = (type: string) => {
    const types = {
      trinity: {
        title: 'Trinity Discovery',
        description: 'Explore your Quest, Service, and Pledge',
        icon: <Lightbulb className="h-5 w-5 text-quest-600" />,
        color: 'quest'
      },
      skills: {
        title: 'Skills Coaching',
        description: 'Strategic skill development guidance',
        icon: <Target className="h-5 w-5 text-service-600" />,
        color: 'service'
      },
      career: {
        title: 'Career Navigation',
        description: 'Career decisions and transitions',
        icon: <Brain className="h-5 w-5 text-purple-600" />,
        color: 'purple'
      },
      wellness: {
        title: 'Wellness Check',
        description: 'Professional wellness and balance',
        icon: <Heart className="h-5 w-5 text-pink-600" />,
        color: 'pink'
      }
    }
    return types[type as keyof typeof types]
  }

  if (isSessionActive) {
    return (
      <VoiceInterface
        sessionType={sessionType}
        duration={sessionDuration}
        onEndSession={endSession}
        voiceSettings={voiceSettings}
        isListening={isListening}
        onToggleListening={() => setIsListening(!isListening)}
        currentMood={currentMood}
        onMoodChange={setCurrentMood}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Mic className="h-8 w-8 text-blue-600" />
          Voice Coach
        </h1>
        <p className="text-slate-600 text-lg">
          Experience empathic AI coaching through natural voice conversation. 
          Get real-time guidance for your professional development journey.
        </p>
      </div>

      {/* Session Types */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(['trinity', 'skills', 'career', 'wellness'] as const).map(type => {
          const info = getSessionTypeInfo(type)
          return (
            <Card 
              key={type}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                sessionType === type ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => setSessionType(type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {info.icon}
                  <CardTitle className="text-lg">{info.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{info.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Session Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getSessionTypeInfo(sessionType).icon}
            Start {getSessionTypeInfo(sessionType).title} Session
          </CardTitle>
          <CardDescription>
            {getSessionTypeInfo(sessionType).description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Settings */}
          <div className="space-y-4">
            <h3 className="font-medium">Voice Settings</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Volume</label>
                <div className="flex items-center gap-3">
                  <VolumeX className="h-4 w-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.volume}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                    className="flex-1"
                  />
                  <Volume2 className="h-4 w-4 text-slate-600" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Speaking Speed</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Slow</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.speed}
                    onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-500">Fast</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Voice Style</label>
                <select
                  value={voiceSettings.voice}
                  onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="empathic">Empathic</option>
                  <option value="professional">Professional</option>
                  <option value="encouraging">Encouraging</option>
                  <option value="thoughtful">Thoughtful</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session Preview */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">What to expect in this session:</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              {sessionType === 'trinity' && (
                <>
                  <li>• Explore your deeper professional purpose and motivation</li>
                  <li>• Clarify how you uniquely serve others</li>
                  <li>• Define meaningful commitments aligned with your values</li>
                  <li>• Integrate all three elements into a coherent identity</li>
                </>
              )}
              {sessionType === 'skills' && (
                <>
                  <li>• Assess your current skills and identify gaps</li>
                  <li>• Create strategic learning paths</li>
                  <li>• Align skill development with career goals</li>
                  <li>• Get personalized learning recommendations</li>
                </>
              )}
              {sessionType === 'career' && (
                <>
                  <li>• Navigate career decisions and transitions</li>
                  <li>• Explore new opportunities and paths</li>
                  <li>• Address career challenges and obstacles</li>
                  <li>• Plan strategic career moves</li>
                </>
              )}
              {sessionType === 'wellness' && (
                <>
                  <li>• Check in on your professional well-being</li>
                  <li>• Address stress and work-life balance</li>
                  <li>• Explore fulfillment and satisfaction</li>
                  <li>• Develop sustainable work practices</li>
                </>
              )}
            </ul>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={startSession}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Voice Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            Your coaching journey and progress over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <div className="text-center py-8">
              <Mic className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="font-medium text-slate-600 mb-2">No sessions yet</h3>
              <p className="text-sm text-slate-500">
                Start your first voice coaching session to begin tracking your progress
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map(session => (
                <div key={session.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getSessionTypeInfo(session.type).icon}
                      <div>
                        <h4 className="font-medium">{getSessionTypeInfo(session.type).title}</h4>
                        <p className="text-sm text-slate-600">
                          {formatDuration(session.duration)} • {session.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${
                      session.mood === 'positive' ? 'border-green-200 text-green-700' :
                      session.mood === 'contemplative' ? 'border-blue-200 text-blue-700' :
                      session.mood === 'energized' ? 'border-orange-200 text-orange-700' :
                      'border-slate-200 text-slate-700'
                    }`}>
                      {session.mood}
                    </Badge>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium mb-2">Key Insights:</h5>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {session.insights.map((insight, index) => (
                        <li key={index}>• {insight}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline">
                      Review Session
                    </Button>
                    <Button size="sm" variant="outline">
                      Continue Theme
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}