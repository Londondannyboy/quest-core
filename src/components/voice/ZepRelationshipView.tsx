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
  Clock,
  Network,
  BarChart3
} from 'lucide-react'
import { ProfessionalNetworkMini } from './ProfessionalNetworkMini'

interface ZepRelationship {
  id: string
  type: string
  from: string
  to: string
  strength: number
  context: string
  extractedAt: string
  category?: 'connection' | 'value' | 'solution' | 'insight' | 'semantic'
  connectionType?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  timeframe?: string
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
    } else if (isVisible) {
      // Show demo data if no session
      setContextData(getDemoData())
    }
  }, [isVisible, sessionId, userId])

  const fetchZepContext = async () => {
    setIsLoading(true)
    try {
      // First, get the latest demo session data
      const sessionResponse = await fetch('/api/zep-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-latest-demo-session' })
      })
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json()
        
        if (sessionData.status === 'success' && sessionData.sessionData) {
          // Convert Zep context to our format
          const zepContext = sessionData.sessionData.context
          const adaptedContext: ZepContextData = {
            relationships: zepContext.relationships || [],
            insights: zepContext.insights?.map((insight: string) => ({
              type: 'goal' as const,
              content: insight,
              confidence: 0.8,
              timestamp: new Date().toISOString()
            })) || [],
            trinityEvolution: {
              quest: zepContext.trinity?.quest,
              service: zepContext.trinity?.service,
              pledge: zepContext.trinity?.pledge,
              confidence: zepContext.trinity?.confidence || 0.75
            },
            conversationSummary: {
              totalMessages: zepContext.conversationHistory?.length || 0,
              keyTopics: ['Career Transition', 'Product Management', 'Skills Development'],
              emotionalTone: 'determined'
            }
          }
          
          setContextData(adaptedContext)
          setLastUpdated(new Date())
        } else {
          // Fallback to demo data if no real session found
          setContextData(getDemoData())
        }
      } else {
        // Fallback to demo data on error
        setContextData(getDemoData())
      }
    } catch (error) {
      console.error('Failed to fetch Zep context:', error)
      // Fallback to demo data on error
      setContextData(getDemoData())
    } finally {
      setIsLoading(false)
    }
  }

  const getDemoData = (): ZepContextData => ({
    relationships: [
      {
        id: 'rel-1',
        type: 'Professional Relationship',
        from: 'User',
        to: 'Product Team',
        strength: 0.9,
        context: 'Discussed transitioning from marketing to product management role',
        extractedAt: new Date().toISOString()
      },
      {
        id: 'rel-2', 
        type: 'Skill Development',
        from: 'User',
        to: 'Technical Skills',
        strength: 0.7,
        context: 'Mentioned need to learn product analytics and user research',
        extractedAt: new Date().toISOString()
      }
    ],
    insights: [
      {
        type: 'goal',
        content: 'Career transition is a primary focus area',
        confidence: 0.8,
        timestamp: new Date().toISOString()
      },
      {
        type: 'skill',
        content: 'Active interest in product management skills',
        confidence: 0.9,
        timestamp: new Date().toISOString()
      }
    ],
    trinityEvolution: {
      quest: 'To transition into product management and build user-centered experiences',
      service: 'Creating digital products that solve real user problems',
      pledge: 'Learning one new PM skill each month and building side projects',
      confidence: 0.75
    },
    conversationSummary: {
      totalMessages: 8,
      keyTopics: ['Career Transition', 'Product Management', 'Skills Development'],
      emotionalTone: 'determined'
    }
  })

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

      {/* Network Visualization */}
      {contextData.relationships.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Network className="h-4 w-4 text-purple-600" />
              Contextual Connections
            </CardTitle>
            <CardDescription className="text-xs">
              How your interests, goals, and experiences interconnect
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Interactive Network Graph */}
            <div className="mb-4">
              <ProfessionalNetworkMini 
                relationships={contextData.relationships}
                width={280}
                height={180}
              />
            </div>

            {/* Connection Statistics */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-blue-600">
                  {contextData.relationships.filter(r => r.category === 'connection').length}
                </div>
                <div className="text-slate-600">Links</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="font-bold text-purple-600">
                  {contextData.relationships.filter(r => r.category === 'value').length}
                </div>
                <div className="text-slate-600">Values</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-green-600">
                  {contextData.relationships.filter(r => r.category === 'solution').length}
                </div>
                <div className="text-slate-600">Solutions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Relationships */}
      {contextData.relationships.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Contextual Insights
              <Badge variant="outline" className="text-xs">
                {contextData.relationships.length} connections
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contextData.relationships.slice(0, 5).map((rel, index) => {
              const getCategoryIcon = (category?: string) => {
                switch (category) {
                  case 'connection': return '🔗';
                  case 'value': return '💎';
                  case 'solution': return '💡';
                  case 'insight': return '🎯';
                  case 'semantic': return '🧠';
                  default: return '🔄';
                }
              };

              const getCategoryColor = (category?: string) => {
                switch (category) {
                  case 'connection': return 'bg-blue-50 border-blue-200';
                  case 'value': return 'bg-purple-50 border-purple-200';
                  case 'solution': return 'bg-green-50 border-green-200';
                  case 'insight': return 'bg-orange-50 border-orange-200';
                  case 'semantic': return 'bg-indigo-50 border-indigo-200';
                  default: return 'bg-slate-50 border-slate-200';
                }
              };

              const getSentimentColor = (sentiment?: string) => {
                switch (sentiment) {
                  case 'positive': return 'text-green-600';
                  case 'negative': return 'text-red-600';
                  default: return 'text-slate-600';
                }
              };

              return (
                <div key={rel.id || index} className={`p-3 rounded border ${getCategoryColor(rel.category)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getCategoryIcon(rel.category)}</span>
                      <div>
                        <div className="font-medium text-sm">{rel.from} → {rel.to}</div>
                        <div className="text-xs text-slate-500">
                          {rel.type} {rel.connectionType && `• ${rel.connectionType}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        {Math.round(rel.strength * 100)}%
                      </Badge>
                      {rel.proficiencyLevel && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          {rel.proficiencyLevel}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-600 mb-2 leading-relaxed">
                    {rel.context}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {rel.sentiment && (
                        <span className={`${getSentimentColor(rel.sentiment)} capitalize`}>
                          {rel.sentiment}
                        </span>
                      )}
                      {rel.timeframe && rel.timeframe !== 'unspecified' && (
                        <span className="text-slate-500">
                          • {rel.timeframe}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400">
                      {new Date(rel.extractedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {contextData.relationships.length > 5 && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-xs">
                  +{contextData.relationships.length - 5} more connections
                </Badge>
              </div>
            )}
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