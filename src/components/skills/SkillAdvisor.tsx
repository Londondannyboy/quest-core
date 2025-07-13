'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  Brain, 
  TrendingUp, 
  Target, 
  Clock,
  Lightbulb,
  BookOpen,
  Users,
  Zap
} from 'lucide-react'

interface Skill {
  id: string
  name: string
  category: string
  currentLevel: number
  targetLevel: number
  market_demand: 'high' | 'medium' | 'low'
  trinity_alignment: 'quest' | 'service' | 'pledge' | 'multiple'
  learning_path: string[]
  time_to_proficiency: string
}

interface SkillAdvisorProps {
  skills: Skill[]
  onClose: () => void
}

interface AdviceResponse {
  type: 'gap_analysis' | 'learning_path' | 'market_insights' | 'trinity_alignment'
  title: string
  content: string
  recommendations: string[]
  priority: 'high' | 'medium' | 'low'
}

export function SkillAdvisor({ skills, onClose }: SkillAdvisorProps) {
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'advisor'
    content: string
    timestamp: Date
  }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<string>('overview')

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    // Add user message
    setConversation(prev => [...prev, {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }])

    setInputMessage('')
    setIsProcessing(true)

    try {
      // Generate AI response based on user input and skills data
      const response = await generateSkillAdvice(inputMessage, skills, analysisMode)
      
      setConversation(prev => [...prev, {
        type: 'advisor',
        content: response,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error generating skill advice:', error)
      setConversation(prev => [...prev, {
        type: 'advisor',
        content: "I apologize, but I'm having trouble analyzing your skills right now. Could you try rephrasing your question?",
        timestamp: new Date()
      }])
    } finally {
      setIsProcessing(false)
    }
  }

  const generateQuickAnalysis = (type: string) => {
    setAnalysisMode(type)
    let prompt = ''
    
    switch (type) {
      case 'gaps':
        prompt = 'Analyze my current skill gaps and recommend priority areas for development'
        break
      case 'trinity':
        prompt = 'How well do my skills align with my Trinity identity and what should I focus on?'
        break
      case 'market':
        prompt = 'What are the market trends for my skills and what opportunities should I pursue?'
        break
      case 'path':
        prompt = 'Create a strategic learning path for my next 6 months of skill development'
        break
      default:
        prompt = 'Provide an overview of my skill portfolio and strategic recommendations'
    }
    
    setInputMessage(prompt)
    handleSendMessage()
  }

  const skillsStats = {
    total: skills.length,
    inProgress: skills.filter(s => s.currentLevel < s.targetLevel).length,
    highDemand: skills.filter(s => s.market_demand === 'high').length,
    questAligned: skills.filter(s => s.trinity_alignment === 'quest' || s.trinity_alignment === 'multiple').length
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            Skills AI Advisor
          </h1>
          <p className="text-slate-600">
            Strategic guidance for your professional development journey
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Skills
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Skills Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Skills Portfolio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{skillsStats.total}</div>
                  <div className="text-xs text-slate-600">Total Skills</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{skillsStats.inProgress}</div>
                  <div className="text-xs text-slate-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{skillsStats.highDemand}</div>
                  <div className="text-xs text-slate-600">High Demand</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{skillsStats.questAligned}</div>
                  <div className="text-xs text-slate-600">Trinity Aligned</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Analysis Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Analysis</CardTitle>
              <CardDescription>Get instant insights about your skills</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => generateQuickAnalysis('gaps')}
              >
                <Target className="mr-2 h-4 w-4" />
                Skill Gap Analysis
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => generateQuickAnalysis('trinity')}
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Trinity Alignment
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => generateQuickAnalysis('market')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Market Insights
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => generateQuickAnalysis('path')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Learning Path
              </Button>
            </CardContent>
          </Card>

          {/* Top Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Priority Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {skills.slice(0, 3).map(skill => (
                <div key={skill.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-sm">{skill.name}</div>
                      <div className="text-xs text-slate-600">{skill.category}</div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        skill.market_demand === 'high' ? 'border-green-200 text-green-700' :
                        skill.market_demand === 'medium' ? 'border-yellow-200 text-yellow-700' :
                        'border-red-200 text-red-700'
                      }`}
                    >
                      {skill.market_demand}
                    </Badge>
                  </div>
                  <Progress value={(skill.currentLevel / skill.targetLevel) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Conversation Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Skills Conversation
              </CardTitle>
              <CardDescription>
                Ask me anything about your skills, career development, or learning strategy
              </CardDescription>
            </CardHeader>
            
            {/* Conversation History */}
            <CardContent className="flex-1 overflow-y-auto space-y-4">
              {conversation.length === 0 && (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-medium text-slate-600 mb-2">Ready to analyze your skills!</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    I can help you with gap analysis, learning paths, market insights, and Trinity alignment.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                    <Button size="sm" variant="outline" onClick={() => generateQuickAnalysis('overview')}>
                      <Zap className="mr-1 h-3 w-3" />
                      Overview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => generateQuickAnalysis('gaps')}>
                      <Target className="mr-1 h-3 w-3" />
                      Find Gaps
                    </Button>
                  </div>
                </div>
              )}

              {conversation.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-50 border'
                  }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-slate-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
                      <span className="text-sm text-slate-600">Analyzing your skills...</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Input Area */}
            <CardContent className="border-t pt-4">
              <div className="flex gap-4">
                <Textarea
                  placeholder="Ask about your skills, learning paths, market opportunities..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isProcessing}
                    size="icon"
                  >
                    <Brain className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Simulated AI skill advice generator
async function generateSkillAdvice(query: string, skills: Skill[], mode: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000))

  // Analyze skills data
  const highDemandSkills = skills.filter(s => s.market_demand === 'high')
  const skillGaps = skills.filter(s => s.currentLevel < s.targetLevel)
  const questSkills = skills.filter(s => s.trinity_alignment === 'quest' || s.trinity_alignment === 'multiple')

  if (query.toLowerCase().includes('gap') || mode === 'gaps') {
    return `**Skill Gap Analysis**

Based on your current portfolio, I've identified ${skillGaps.length} skills where you have growth opportunities:

**Priority Gaps:**
${skillGaps.slice(0, 3).map(skill => 
  `• **${skill.name}**: Currently at level ${skill.currentLevel}, targeting level ${skill.targetLevel}
    Market demand: ${skill.market_demand.toUpperCase()}
    Estimated time to target: ${skill.time_to_proficiency}`
).join('\n\n')}

**Recommendations:**
1. Focus on ${highDemandSkills[0]?.name || 'Data Analysis'} first - high market demand
2. Dedicate 2-3 hours per week to structured learning
3. Seek projects that let you practice these skills
4. Consider certification programs for credibility

Would you like me to create a detailed learning plan for any of these skills?`
  }

  if (query.toLowerCase().includes('trinity') || mode === 'trinity') {
    return `**Trinity Alignment Analysis**

Your skills portfolio shows strong alignment with your professional identity:

**Quest-Aligned Skills (${questSkills.length} skills):**
${questSkills.map(skill => `• ${skill.name} - ${skill.trinity_alignment} alignment`).join('\n')}

**Alignment Insights:**
- ${((questSkills.length / skills.length) * 100).toFixed(0)}% of your skills support your Trinity identity
- Strong focus on ${questSkills[0]?.category.toLowerCase()} capabilities
- Good balance between technical and strategic skills

**Recommendations:**
1. Develop skills that bridge all three Trinity elements
2. Consider adding communication skills to amplify your service
3. Look for leadership opportunities to live your pledge

How can I help you align your skill development more closely with your authentic purpose?`
  }

  if (query.toLowerCase().includes('market') || mode === 'market') {
    return `**Market Intelligence Report**

Current market analysis for your skill portfolio:

**High-Demand Skills in Your Portfolio:**
${highDemandSkills.map(skill => 
  `• **${skill.name}**: ${skill.market_demand.toUpperCase()} demand
    Your level: ${skill.currentLevel}/5
    Market opportunity: Excellent for career advancement`
).join('\n\n')}

**Market Trends:**
- AI/ML skills seeing 40% year-over-year growth
- Leadership skills remain consistently high-demand
- Cross-functional capabilities increasingly valued

**Strategic Opportunities:**
1. Combine technical skills with business acumen
2. Develop expertise in emerging technologies
3. Build skills that can't be easily automated

What specific market opportunities would you like to explore?`
  }

  if (query.toLowerCase().includes('path') || mode === 'path') {
    return `**6-Month Strategic Learning Path**

Based on your goals and market opportunities:

**Month 1-2: Foundation Strengthening**
- ${skillGaps[0]?.learning_path[0] || 'Core fundamentals'}
- ${skillGaps[0]?.learning_path[1] || 'Practical applications'}
- Weekly commitment: 5-7 hours

**Month 3-4: Practical Application**
- ${skillGaps[0]?.learning_path[2] || 'Advanced concepts'}
- Real-world project implementation
- Seek mentorship or join communities

**Month 5-6: Mastery & Integration**
- ${skillGaps[0]?.learning_path[3] || 'Expert-level techniques'}
- Teaching others or leading projects
- Portfolio development

**Success Metrics:**
- Move from level ${skillGaps[0]?.currentLevel || 2} to ${skillGaps[0]?.targetLevel || 4} in target skill
- Complete 2-3 practical projects
- Build network of 5+ professionals in the field

Would you like me to detail any specific part of this learning path?`
  }

  // Default overview response
  return `**Skills Portfolio Overview**

You have a strong foundation with ${skills.length} skills across multiple categories:

**Strengths:**
- ${highDemandSkills.length} high-demand market skills
- ${((skills.filter(s => s.currentLevel >= 3).length / skills.length) * 100).toFixed(0)}% of skills at intermediate+ level
- Good Trinity alignment with ${questSkills.length} purpose-driven skills

**Growth Opportunities:**
- ${skillGaps.length} skills ready for development
- Focus on bridging technical and strategic capabilities
- Consider emerging skills in your field

**Next Steps:**
1. Prioritize ${skillGaps[0]?.name || 'your top gap skill'} for immediate development
2. Seek stretch projects using your strong skills
3. Build learning habits (2-3 hours/week minimum)

What specific aspect of your skill development would you like to explore deeper?`
}