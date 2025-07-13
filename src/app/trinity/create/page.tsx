'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Lightbulb, Target, Shield, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { TrinityCoach } from '@/components/trinity/TrinityCoach'

interface TrinityData {
  quest: string
  service: string
  pledge: string
}

type TrinityStep = 'intro' | 'quest' | 'service' | 'pledge' | 'integration' | 'complete'

export default function TrinityCreatePage() {
  const [currentStep, setCurrentStep] = useState<TrinityStep>('intro')
  const [trinityData, setTrinityData] = useState<TrinityData>({
    quest: '',
    service: '',
    pledge: ''
  })
  const [isCoachingMode, setIsCoachingMode] = useState(false)

  const steps: { id: TrinityStep; title: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'intro', 
      title: 'Welcome', 
      icon: <Sparkles className="h-6 w-6" />, 
      description: 'Begin your Trinity journey' 
    },
    { 
      id: 'quest', 
      title: 'Quest', 
      icon: <Lightbulb className="h-6 w-6 text-quest-600" />, 
      description: 'What drives you?' 
    },
    { 
      id: 'service', 
      title: 'Service', 
      icon: <Target className="h-6 w-6 text-service-600" />, 
      description: 'How do you serve?' 
    },
    { 
      id: 'pledge', 
      title: 'Pledge', 
      icon: <Shield className="h-6 w-6 text-pledge-600" />, 
      description: 'What do you commit to?' 
    },
    { 
      id: 'integration', 
      title: 'Integration', 
      icon: <Sparkles className="h-6 w-6" />, 
      description: 'Bring it all together' 
    }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const progress = currentStep === 'complete' ? 100 : (currentStepIndex / (steps.length - 1)) * 100

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    } else {
      setCurrentStep('complete')
    }
  }

  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const updateTrinityData = (field: keyof TrinityData, value: string) => {
    setTrinityData(prev => ({ ...prev, [field]: value }))
  }

  if (isCoachingMode) {
    return (
      <TrinityCoach 
        currentStep={currentStep}
        trinityData={trinityData}
        onUpdateTrinity={updateTrinityData}
        onStepChange={(step) => setCurrentStep(step)}
        onExitCoaching={() => setIsCoachingMode(false)}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Create Your Trinity</h1>
        <p className="text-slate-600 text-lg">
          Discover your authentic professional identity through guided self-reflection
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-600">Progress</span>
          <span className="text-sm text-slate-500">{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${
                index <= currentStepIndex ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStepIndex
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-300 bg-slate-50'
                }`}
              >
                {step.icon}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 ml-2 ${
                    index < currentStepIndex ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <Card className="mb-8">
        <CardHeader>
          {currentStep === 'intro' && (
            <>
              <CardTitle className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Welcome to Your Trinity Journey
              </CardTitle>
              <CardDescription>
                The Trinity system helps you discover your authentic professional identity through three eternal questions
              </CardDescription>
            </>
          )}
          
          {currentStep === 'quest' && (
            <>
              <CardTitle className="flex items-center gap-3 text-quest-700">
                <Lightbulb className="h-6 w-6 text-quest-600" />
                Discover Your Quest
              </CardTitle>
              <CardDescription>
                What drives you? What is your deepest professional motivation?
              </CardDescription>
            </>
          )}
          
          {currentStep === 'service' && (
            <>
              <CardTitle className="flex items-center gap-3 text-service-700">
                <Target className="h-6 w-6 text-service-600" />
                Define Your Service
              </CardTitle>
              <CardDescription>
                How do you serve? What unique value do you bring to others?
              </CardDescription>
            </>
          )}
          
          {currentStep === 'pledge' && (
            <>
              <CardTitle className="flex items-center gap-3 text-pledge-700">
                <Shield className="h-6 w-6 text-pledge-600" />
                Articulate Your Pledge
              </CardTitle>
              <CardDescription>
                What do you commit to? What promises does your work make to the world?
              </CardDescription>
            </>
          )}
          
          {currentStep === 'integration' && (
            <>
              <CardTitle className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-purple-600" />
                Your Trinity Integration
              </CardTitle>
              <CardDescription>
                See how your Quest, Service, and Pledge work together to define your authentic professional identity
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent>
          {currentStep === 'intro' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="trinity-quest p-4 rounded-lg border-2">
                  <h3 className="font-semibold text-quest-700 mb-2">Quest</h3>
                  <p className="text-sm text-slate-600">
                    Your deepest motivation and purpose. What makes you come alive?
                  </p>
                </div>
                <div className="trinity-service p-4 rounded-lg border-2">
                  <h3 className="font-semibold text-service-700 mb-2">Service</h3>
                  <p className="text-sm text-slate-600">
                    Your unique contribution. How do you create value for others?
                  </p>
                </div>
                <div className="trinity-pledge p-4 rounded-lg border-2">
                  <h3 className="font-semibold text-pledge-700 mb-2">Pledge</h3>
                  <p className="text-sm text-slate-600">
                    Your commitment to excellence. What do you promise to uphold?
                  </p>
                </div>
              </div>
              
              <div className="text-center space-y-4">
                <p className="text-slate-600">
                  This journey will take about 20-30 minutes. You can take your time and return anytime to refine your Trinity.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setIsCoachingMode(true)} variant="outline">
                    Start with AI Coaching
                  </Button>
                  <Button onClick={handleNext}>
                    Begin Self-Guided Journey
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'quest' && (
            <div className="space-y-6">
              <div className="trinity-quest p-6 rounded-lg border-2">
                <h3 className="font-semibold text-quest-700 mb-4">Reflection Questions</h3>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li>• What work makes you lose track of time?</li>
                  <li>• What problems in the world keep you up at night?</li>
                  <li>• When do you feel most aligned and authentic?</li>
                  <li>• What impact do you want your career to have?</li>
                </ul>
                <Textarea
                  placeholder="Describe what drives you at the deepest level..."
                  value={trinityData.quest}
                  onChange={(e) => updateTrinityData('quest', e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          {currentStep === 'service' && (
            <div className="space-y-6">
              <div className="trinity-service p-6 rounded-lg border-2">
                <h3 className="font-semibold text-service-700 mb-4">Reflection Questions</h3>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li>• What do people consistently come to you for help with?</li>
                  <li>• What complex problems do you solve easily?</li>
                  <li>• What value do you create that you're most proud of?</li>
                  <li>• How has your ability to serve others evolved?</li>
                </ul>
                <Textarea
                  placeholder="Describe how you uniquely serve others..."
                  value={trinityData.service}
                  onChange={(e) => updateTrinityData('service', e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          {currentStep === 'pledge' && (
            <div className="space-y-6">
              <div className="trinity-pledge p-6 rounded-lg border-2">
                <h3 className="font-semibold text-pledge-700 mb-4">Reflection Questions</h3>
                <ul className="space-y-2 text-sm text-slate-600 mb-6">
                  <li>• What promises do you want your work to make to the world?</li>
                  <li>• How do you want to be held accountable for your impact?</li>
                  <li>• What standards do you set that go beyond job requirements?</li>
                  <li>• What commitment would make you proud in 10 years?</li>
                </ul>
                <Textarea
                  placeholder="Describe what you commit to in your professional life..."
                  value={trinityData.pledge}
                  onChange={(e) => updateTrinityData('pledge', e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
            </div>
          )}

          {currentStep === 'integration' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="trinity-quest p-4 rounded-lg border-2">
                  <h3 className="font-semibold text-quest-700 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Your Quest
                  </h3>
                  <p className="text-sm text-slate-600">
                    {trinityData.quest || 'Not yet defined'}
                  </p>
                </div>
                <div className="trinity-service p-4 rounded-lg border-2">
                  <h3 className="font-semibold text-service-700 mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your Service
                  </h3>
                  <p className="text-sm text-slate-600">
                    {trinityData.service || 'Not yet defined'}
                  </p>
                </div>
                <div className="trinity-pledge p-4 rounded-lg border-2">
                  <h3 className="font-semibold text-pledge-700 mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Your Pledge
                  </h3>
                  <p className="text-sm text-slate-600">
                    {trinityData.pledge || 'Not yet defined'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold mb-4">Trinity Coherence Analysis</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Your Trinity elements work together to create your authentic professional identity. 
                  Consider how your Quest drives your Service, and how your Pledge ensures you serve at your highest level.
                </p>
                <Button onClick={() => setIsCoachingMode(true)} variant="outline">
                  Get AI Coaching on Integration
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStepIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setIsCoachingMode(true)}
          >
            Get AI Coaching
          </Button>
          
          {currentStep !== 'integration' ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep('complete')}>
              Complete Trinity
              <Sparkles className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {currentStep === 'complete' && (
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-700">
              <Sparkles className="h-6 w-6" />
              Trinity Complete!
            </CardTitle>
            <CardDescription>
              Congratulations! You've created your professional Trinity. This is just the beginning of your journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button>Save & Continue to Skills</Button>
              <Button variant="outline">Share Your Trinity</Button>
              <Button variant="outline">Refine with AI Coach</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}