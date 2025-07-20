'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  MessageCircle, 
  Target,
  Users,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  CheckCircle
} from 'lucide-react'

interface DemoResult {
  status: string
  scenario: string
  demoUser: {
    userId: string
    name: string
    trinity: any
  }
  session: {
    sessionId: string
    turns: number
    totalCost: number
  }
  conversation: Array<{
    turn: number
    user: string
    coach: string
    assistant: string
    context: any
    aiMetrics: any
  }>
  memoryAccumulation: {
    relevantFacts: string[]
    conversationHistory: number
    insights: string[]
    trinity: any
  }
}

export default function ZepDemoPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<DemoResult | null>(null)
  const [selectedScenario, setSelectedScenario] = useState('career-transition')

  const scenarios = [
    {
      id: 'career-transition',
      title: 'Career Transition',
      description: 'Marketing manager transitioning to product management',
      icon: <Target className="h-5 w-5 text-purple-600" />,
      user: 'Sarah Chen'
    },
    {
      id: 'skill-development', 
      title: 'Skill Development',
      description: 'Frontend developer learning full-stack development',
      icon: <Brain className="h-5 w-5 text-blue-600" />,
      user: 'Marcus Rodriguez'
    },
    {
      id: 'leadership-growth',
      title: 'Leadership Growth',
      description: 'New team lead learning to manage people',
      icon: <Users className="h-5 w-5 text-green-600" />,
      user: 'Dr. Emma Johnson'
    },
    {
      id: 'networking-focus',
      title: 'Networking Focus', 
      description: 'Introvert building professional relationships',
      icon: <MessageCircle className="h-5 w-5 text-orange-600" />,
      user: 'Alex Thompson'
    }
  ]

  const testConnection = async () => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/test-zep-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simple: true })
      })
      
      const data = await response.json()
      alert(`Zep Connection: ${data.zepConnected ? 'SUCCESS' : 'FAILED'}`)
    } catch (error) {
      console.error('Connection test error:', error)
      alert('Connection test failed - check console')
    } finally {
      setIsRunning(false)
    }
  }

  const runDemo = async (reset = false) => {
    setIsRunning(true)
    try {
      const response = await fetch('/api/test-zep-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenario: selectedScenario,
          reset 
        })
      })
      
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Demo error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <Brain className="h-8 w-8 text-blue-600" />
          Zep Memory Integration Demo
        </h1>
        <p className="text-slate-600 text-lg max-w-3xl mx-auto">
          Test conversational memory and context accumulation across multiple coaching sessions. 
          See how Zep enables personalized, contextual AI coaching experiences.
        </p>
      </div>

      {/* Scenario Selection */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {scenarios.map(scenario => (
          <Card 
            key={scenario.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedScenario === scenario.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-slate-50'
            }`}
            onClick={() => setSelectedScenario(scenario.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {scenario.icon}
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-2">{scenario.description}</p>
              <Badge variant="outline" className="text-xs">
                User: {scenario.user}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Demo Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-yellow-600" />
            Demo Controls
          </CardTitle>
          <CardDescription>
            Run a simulated multi-turn coaching conversation to see Zep memory in action
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={() => testConnection()}
              disabled={isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Test Zep Connection
            </Button>
            
            <Button 
              onClick={() => runDemo(false)} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Run Demo Conversation
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => runDemo(true)} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset & Run Fresh
            </Button>
          </div>
          
          <div className="text-sm text-slate-600">
            <p><strong>What this tests:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Multi-coach conversation routing (Career, Skills, Leadership, Network)</li>
              <li>Memory persistence across conversation turns</li>
              <li>Context accumulation and Trinity evolution tracking</li>
              <li>Cost optimization through OpenRouter model selection</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Demo Results Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.session.turns}</div>
                <div className="text-sm text-slate-600">Conversation Turns</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.memoryAccumulation.conversationHistory}</div>
                <div className="text-sm text-slate-600">Messages Stored</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{results.memoryAccumulation.relevantFacts.length}</div>
                <div className="text-sm text-slate-600">Facts Extracted</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">${results.session.totalCost.toFixed(4)}</div>
                <div className="text-sm text-slate-600">Total AI Cost</div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation */}
          <Card>
            <CardHeader>
              <CardTitle>Demo Conversation</CardTitle>
              <CardDescription>
                {results.demoUser.name} - {results.scenario.replace('-', ' ')} scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.conversation.map((turn, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Turn {turn.turn}</Badge>
                    <Badge className="capitalize">{turn.coach} Coach</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>User:</strong> {turn.user}
                    </div>
                    <div className="bg-slate-50 p-3 rounded">
                      <strong>Coach:</strong> {turn.assistant}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-slate-600">
                    <span>Model: {turn.aiMetrics.model}</span>
                    <span>Cost: ${turn.aiMetrics.cost.toFixed(6)}</span>
                    <span>Context: {turn.context.relevantFacts} facts</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Memory Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Memory Accumulation Analysis</CardTitle>
              <CardDescription>
                How Zep extracted and stored contextual information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.memoryAccumulation.trinity && (
                <div>
                  <h4 className="font-semibold mb-2">Trinity Evolution</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-quest-50 p-3 rounded">
                      <strong>Quest:</strong> {results.memoryAccumulation.trinity.quest}
                    </div>
                    <div className="bg-service-50 p-3 rounded">
                      <strong>Service:</strong> {results.memoryAccumulation.trinity.service}
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>Pledge:</strong> {results.memoryAccumulation.trinity.pledge}
                    </div>
                  </div>
                </div>
              )}
              
              {results.memoryAccumulation.insights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Extracted Insights</h4>
                  <div className="space-y-2">
                    {results.memoryAccumulation.insights.map((insight, index) => (
                      <div key={index} className="bg-yellow-50 p-2 rounded text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {results.memoryAccumulation.relevantFacts.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Relevant Facts Stored</h4>
                  <div className="space-y-2">
                    {results.memoryAccumulation.relevantFacts.map((fact, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded text-sm">
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}