'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, DollarSign, Brain, MessageCircle, Network } from 'lucide-react'

interface TestResult {
  overallStatus: string
  timestamp: string
  connections: {
    openRouterAI: boolean
    zepMemory: boolean
    status: string
  }
  aiIntegration: {
    coachType: string
    model: string
    tokensUsed: number
    estimatedCost: number
    responseTime: string
    contentPreview: string
    status: string
  }
  memoryIntegration: {
    initialFacts: number
    finalFacts: number
    memoryPersistence: boolean
    trinityData: any
    status: string
  }
  liveContext: {
    relationships: number
    insights: number
    keyTopics: string[]
    status: string
  }
  costTracking: {
    sessionCost: number
    totalUserCost: number
    model: string
  }
  summary: {
    allSystemsOperational: boolean
    integrationWorking: boolean
    costOptimizationActive: boolean
    memoryWorking: boolean
    ready: string
  }
}

export default function TestIntegrationPage() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runFullTest = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      const response = await fetch('/api/test-full-integration')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setTestResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string | boolean) => {
    if (status === 'PASS' || status === true) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    } else if (status === 'FAIL' || status === false) {
      return <XCircle className="h-5 w-5 text-red-600" />
    } else {
      return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Quest Core Integration Test</h1>
          <p className="text-slate-600">
            Test the complete AI coaching system with OpenRouter, Zep memory, and live context integration
          </p>
          
          <Button 
            onClick={runFullTest} 
            disabled={isLoading}
            size="lg"
            className="bg-quest-600 hover:bg-quest-700"
          >
            {isLoading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running Full Integration Test...
              </>
            ) : (
              'Run Full Integration Test'
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">Test Failed:</span>
                <span className="text-red-700">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className={`${testResult.summary.allSystemsOperational ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(testResult.summary.allSystemsOperational)}
                    Integration Status
                  </CardTitle>
                  <Badge variant={testResult.summary.allSystemsOperational ? 'default' : 'secondary'}>
                    {testResult.summary.allSystemsOperational ? 'All Systems Operational' : 'Partial Operation'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{testResult.summary.ready}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(testResult.summary.integrationWorking)}
                        <span className="text-xs">Integration</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(testResult.summary.costOptimizationActive)}
                        <span className="text-xs">Cost Optimization</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(testResult.summary.memoryWorking)}
                        <span className="text-xs">Memory</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(testResult.summary.allSystemsOperational)}
                        <span className="text-xs">Overall</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Connection Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <span>OpenRouter AI</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResult.connections.openRouterAI)}
                      <Badge variant={testResult.connections.openRouterAI ? 'default' : 'destructive'}>
                        {testResult.connections.openRouterAI ? 'Connected' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
                    <span>Zep Memory</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(testResult.connections.zepMemory)}
                      <Badge variant={testResult.connections.zepMemory ? 'default' : 'destructive'}>
                        {testResult.connections.zepMemory ? 'Connected' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Integration Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-800">{testResult.aiIntegration.coachType}</div>
                    <div className="text-xs text-blue-600">Coach Type</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="font-semibold text-green-800">{testResult.aiIntegration.model}</div>
                    <div className="text-xs text-green-600">AI Model</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="font-semibold text-purple-800">{testResult.aiIntegration.responseTime}</div>
                    <div className="text-xs text-purple-600">Response Time</div>
                  </div>
                </div>
                
                <div className="bg-slate-100 p-3 rounded text-sm">
                  <strong>Response Preview:</strong> {testResult.aiIntegration.contentPreview}
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-slate-600">
                    {testResult.aiIntegration.tokensUsed} tokens used
                  </span>
                  <Badge variant="outline">
                    {getStatusIcon(testResult.aiIntegration.status)}
                    {testResult.aiIntegration.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Memory Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Memory Integration Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-800">{testResult.memoryIntegration.initialFacts}</div>
                    <div className="text-xs text-blue-600">Initial Facts</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="font-semibold text-green-800">{testResult.memoryIntegration.finalFacts}</div>
                    <div className="text-xs text-green-600">Final Facts</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="font-semibold text-purple-800">
                      {testResult.memoryIntegration.memoryPersistence ? 'Yes' : 'No'}
                    </div>
                    <div className="text-xs text-purple-600">Persistence</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(testResult.memoryIntegration.status)}
                    </div>
                    <div className="text-xs text-orange-600">Status</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Live Context Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-800">{testResult.liveContext.relationships}</div>
                    <div className="text-xs text-blue-600">Relationships</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="font-semibold text-green-800">{testResult.liveContext.insights}</div>
                    <div className="text-xs text-green-600">Insights</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="flex items-center justify-center">
                      {getStatusIcon(testResult.liveContext.status)}
                    </div>
                    <div className="text-xs text-purple-600">Status</div>
                  </div>
                </div>
                
                {testResult.liveContext.keyTopics.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Key Topics:</div>
                    <div className="flex flex-wrap gap-1">
                      {testResult.liveContext.keyTopics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cost Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded">
                    <div className="font-semibold text-green-800">{formatCost(testResult.costTracking.sessionCost)}</div>
                    <div className="text-xs text-green-600">Session Cost</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-800">{formatCost(testResult.costTracking.totalUserCost)}</div>
                    <div className="text-xs text-blue-600">Total User Cost</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <div className="font-semibold text-purple-800 text-sm">{testResult.costTracking.model}</div>
                    <div className="text-xs text-purple-600">Model Used</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timestamp */}
            <div className="text-center text-xs text-slate-500">
              Test completed at {new Date(testResult.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}