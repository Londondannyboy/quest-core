'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Users, 
  Target,
  MessageCircle,
  TrendingUp,
  Clock
} from 'lucide-react'

interface ZepRelationship {
  id: string
  type: string
  from: string
  to: string
  strength: number
  context: string
  extractedAt: string
}

interface ZepInsight {
  type: 'skill' | 'goal' | 'challenge' | 'relationship' | 'growth'
  content: string
  confidence: number
  timestamp: string
}

interface ZepContextData {
  relationships: ZepRelationship[]
  insights: ZepInsight[]
  trinityEvolution: {
    quest?: string
    service?: string
    pledge?: string
    confidence: number
  }
  conversationSummary: {
    totalMessages: number
    keyTopics: string[]
    emotionalTone: string
  }
}

interface ZepRelationshipViewProps {
  sessionId?: string
  userId?: string
  isVisible: boolean
}

export function ZepRelationshipView({ 
  sessionId, 
  userId, 
  isVisible 
}: ZepRelationshipViewProps) {
  const [contextData, setContextData] = useState<ZepContextData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (isVisible && sessionId && userId) {
      fetchZepContext()
      // Auto-refresh every 30 seconds during active session
      const interval = setInterval(fetchZepContext, 30000)
      return () => clearInterval(interval)
    }
  }, [isVisible, sessionId, userId])

  const fetchZepContext = async () => {
    if (!sessionId || !userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/zep-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId })
      })
      
      if (response.ok) {
        const data = await response.json()
        setContextData(data.context)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch Zep context:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible || !contextData) {
    return null
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Memory Context
        </h3>
        {lastUpdated && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Trinity Evolution */}
      {contextData.trinityEvolution.confidence > 0.5 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-quest-600" />
              Trinity Insights
              <Badge variant="outline" className="text-xs">
                {Math.round(contextData.trinityEvolution.confidence * 100)}% confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contextData.trinityEvolution.quest && (
              <div className="bg-quest-50 p-2 rounded text-sm">
                <strong>Quest:</strong> {contextData.trinityEvolution.quest}
              </div>
            )}
            {contextData.trinityEvolution.service && (
              <div className="bg-service-50 p-2 rounded text-sm">
                <strong>Service:</strong> {contextData.trinityEvolution.service}
              </div>
            )}
            {contextData.trinityEvolution.pledge && (
              <div className="bg-purple-50 p-2 rounded text-sm">
                <strong>Pledge:</strong> {contextData.trinityEvolution.pledge}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Relationships */}
      {contextData.relationships.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Relationship Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contextData.relationships.slice(0, 3).map((rel, index) => (
              <div key={rel.id || index} className="bg-blue-50 p-2 rounded text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{rel.type}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(rel.strength * 100)}% relevant
                  </Badge>
                </div>
                <div className="text-xs text-slate-600">
                  {rel.from} → {rel.to}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {rel.context}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {contextData.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contextData.insights.slice(0, 4).map((insight, index) => (
              <div key={index} className="bg-green-50 p-2 rounded text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs capitalize">
                    {insight.type}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {Math.round(insight.confidence * 100)}%
                  </span>
                </div>
                <div>{insight.content}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conversation Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-orange-600" />
            Session Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-orange-50 p-2 rounded">
              <div className="font-medium">Messages</div>
              <div>{contextData.conversationSummary.totalMessages}</div>
            </div>
            <div className="bg-orange-50 p-2 rounded">
              <div className="font-medium">Tone</div>
              <div className="capitalize">{contextData.conversationSummary.emotionalTone}</div>
            </div>
          </div>
          {contextData.conversationSummary.keyTopics.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-1">Key Topics:</div>
              <div className="flex flex-wrap gap-1">
                {contextData.conversationSummary.keyTopics.slice(0, 4).map((topic, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading indicator */}
      {isLoading && (
        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin"></div>
            Updating context...
          </div>
        </div>
      )}
    </div>
  )
}