'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { 
  BookOpen, 
  TrendingUp, 
  Target, 
  Zap, 
  Search, 
  Plus,
  Star,
  Clock,
  Users,
  Award
} from 'lucide-react'
import { SkillAdvisor } from '@/components/skills/SkillAdvisor'

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

export default function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAdvisor, setShowAdvisor] = useState(false)

  // Sample skills data
  const [skills] = useState<Skill[]>([
    {
      id: '1',
      name: 'Data Analysis',
      category: 'Technical',
      currentLevel: 3,
      targetLevel: 5,
      market_demand: 'high',
      trinity_alignment: 'service',
      learning_path: ['SQL Basics', 'Python for Data', 'Statistical Analysis', 'Data Visualization'],
      time_to_proficiency: '6 months'
    },
    {
      id: '2',
      name: 'Team Leadership',
      category: 'Leadership',
      currentLevel: 2,
      targetLevel: 4,
      market_demand: 'high',
      trinity_alignment: 'pledge',
      learning_path: ['Leadership Principles', 'Team Dynamics', 'Conflict Resolution', 'Strategic Thinking'],
      time_to_proficiency: '8 months'
    },
    {
      id: '3',
      name: 'Product Strategy',
      category: 'Strategic',
      currentLevel: 4,
      targetLevel: 5,
      market_demand: 'medium',
      trinity_alignment: 'quest',
      learning_path: ['Market Research', 'Competitive Analysis', 'Product Roadmapping'],
      time_to_proficiency: '4 months'
    },
    {
      id: '4',
      name: 'Machine Learning',
      category: 'Technical',
      currentLevel: 1,
      targetLevel: 3,
      market_demand: 'high',
      trinity_alignment: 'multiple',
      learning_path: ['Python Programming', 'Statistics', 'ML Algorithms', 'Model Deployment'],
      time_to_proficiency: '12 months'
    }
  ])

  const categories = ['all', 'Technical', 'Leadership', 'Strategic', 'Communication', 'Creative']

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getTrinityColor = (alignment: string) => {
    switch (alignment) {
      case 'quest': return 'bg-quest-100 text-quest-700 border-quest-200'
      case 'service': return 'bg-service-100 text-service-700 border-service-200'  
      case 'pledge': return 'bg-pledge-100 text-pledge-700 border-pledge-200'
      case 'multiple': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'high': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-red-600'
      default: return 'text-slate-600'
    }
  }

  if (showAdvisor) {
    return (
      <SkillAdvisor 
        skills={skills}
        onClose={() => setShowAdvisor(false)}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-4">Skills Intelligence</h1>
        <p className="text-slate-600 text-lg">
          Strategic skill development aligned with your Trinity identity. 
          Build capabilities that support your authentic professional purpose.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowAdvisor(true)}>
          <Zap className="mr-2 h-4 w-4" />
          Get AI Skill Advice
        </Button>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'All Skills' : category}
          </Button>
        ))}
      </div>

      {/* Skills Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Total Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skills.length}</div>
            <p className="text-sm text-slate-600">Active learning paths</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills.filter(s => s.currentLevel < s.targetLevel).length}
            </div>
            <p className="text-sm text-slate-600">Skills developing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              High Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills.filter(s => s.market_demand === 'high').length}
            </div>
            <p className="text-sm text-slate-600">Market opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Mastered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {skills.filter(s => s.currentLevel >= s.targetLevel).length}
            </div>
            <p className="text-sm text-slate-600">Skills achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSkills.map(skill => (
          <Card key={skill.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <CardDescription>{skill.category}</CardDescription>
                </div>
                <Badge 
                  variant="outline" 
                  className={getTrinityColor(skill.trinity_alignment)}
                >
                  {skill.trinity_alignment}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{skill.currentLevel}/{skill.targetLevel}</span>
                </div>
                <Progress value={(skill.currentLevel / skill.targetLevel) * 100} />
              </div>

              {/* Market Demand */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Market Demand</span>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`h-4 w-4 ${getDemandColor(skill.market_demand)}`} />
                  <span className={`text-sm font-medium ${getDemandColor(skill.market_demand)}`}>
                    {skill.market_demand}
                  </span>
                </div>
              </div>

              {/* Time to Proficiency */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Time to Target</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span className="text-sm">{skill.time_to_proficiency}</span>
                </div>
              </div>

              {/* Learning Path Preview */}
              <div>
                <div className="text-sm font-medium mb-2">Next Steps</div>
                <div className="flex flex-wrap gap-1">
                  {skill.learning_path.slice(0, 2).map((step, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {step}
                    </Badge>
                  ))}
                  {skill.learning_path.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{skill.learning_path.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Continue Learning
                </Button>
                <Button size="sm" variant="outline">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No skills found</h3>
            <p className="text-slate-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Start building your skill portfolio'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Skill
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}