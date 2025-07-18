'use client'

import { useState } from 'react'
// import { brokenFunction } from './test-auto-fix-failure.md'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Lightbulb, Target, Shield, Mic, BookOpen, Users, LogIn, UserPlus } from 'lucide-react'
import { useUser, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import Link from 'next/link'

export default function HomePage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const { user } = useUser()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Auth Bar */}
      <div className="flex justify-end mb-8">
        <SignedIn>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">Welcome back, {user?.firstName || 'Quest Explorer'}!</span>
            <UserButton />
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex gap-2">
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Sign Up
              </Button>
            </Link>
          </div>
        </SignedOut>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Quest Core
        </h1>
        <p className="text-xl text-slate-600 mb-8 leading-relaxed">
          Discover your authentic professional identity through the three eternal questions:
          <span className="font-semibold text-blue-600"> What drives you?</span>{' '}
          <span className="font-semibold text-green-600">How do you serve?</span>{' '}
          <span className="font-semibold text-yellow-600">What do you commit to?</span>
        </p>
        <div className="flex gap-4 justify-center">
          <SignedIn>
            <Link href="/trinity/create">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Continue Your Trinity Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/voice-coach">
              <Button variant="outline" size="lg">
                Voice Coaching
              </Button>
            </Link>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </SignedOut>
        </div>
      </div>

      {/* Trinity Overview */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card 
          className="trinity-quest border-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
          onMouseEnter={() => setHoveredCard('quest')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-blue-600" />
              <CardTitle className="text-blue-700">Quest</CardTitle>
            </div>
            <CardDescription>What drives you?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Discover your deepest professional motivation, purpose, and calling. What makes you come alive at work?
            </p>
            {hoveredCard === 'quest' && (
              <div className="trinity-reveal">
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Values archaeology</li>
                  <li>• Passion exploration</li>
                  <li>• Legacy visioning</li>
                  <li>• Story pattern analysis</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="trinity-service border-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
          onMouseEnter={() => setHoveredCard('service')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-600" />
              <CardTitle className="text-green-700">Service</CardTitle>
            </div>
            <CardDescription>How do you serve?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Define how you uniquely contribute value to others. What complex problems do you solve that others find difficult?
            </p>
            {hoveredCard === 'service' && (
              <div className="trinity-reveal">
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Strength identification</li>
                  <li>• Impact assessment</li>
                  <li>• Unique value proposition</li>
                  <li>• Service evolution tracking</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className="trinity-pledge border-2 transition-all duration-300 hover:shadow-lg hover:scale-105"
          onMouseEnter={() => setHoveredCard('pledge')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-yellow-600" />
              <CardTitle className="text-yellow-700">Pledge</CardTitle>
            </div>
            <CardDescription>What do you commit to?</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Articulate meaningful commitments that align with your values. What promises does your work make to the world?
            </p>
            {hoveredCard === 'pledge' && (
              <div className="trinity-reveal">
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• Values-based commitment</li>
                  <li>• Accountable specificity</li>
                  <li>• Stakeholder awareness</li>
                  <li>• Sustainable challenge</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mic className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg">Voice Coaching</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Experience empathic AI coaching through natural voice conversation. Get real-time guidance and support.
            </p>
            <Link href="/voice-coach">
              <Button variant="outline" size="sm">
                Try Voice Coach
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-green-600" />
              <CardTitle className="text-lg">Skills Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Strategic skill development aligned with your Trinity. Get personalized learning paths and market insights.
            </p>
            <Link href="/skills">
              <Button variant="outline" size="sm">
                Explore Skills
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-purple-600" />
              <CardTitle className="text-lg">Career Coaching</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Navigate career decisions with Trinity-aligned guidance. Connect with opportunities that match your authentic self.
            </p>
            <Link href="/trinity/create">
              <Button variant="outline" size="sm">
                Career Guidance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-12">
        <SignedIn>
          <h2 className="text-3xl font-bold mb-4">Ready to dive deeper into your professional identity?</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Now that you&apos;re part of the Quest Core community, explore advanced features and deepen your Trinity understanding
            with our AI-powered voice coaching and personalized skill development.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/voice-coach">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Try Voice Coaching
                <Mic className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/trinity/create">
              <Button variant="outline" size="lg">
                Refine Your Trinity
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </SignedIn>
        <SignedOut>
          <h2 className="text-3xl font-bold mb-4">Ready to discover your authentic professional identity?</h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have discovered their true calling through the Trinity system. 
            Your journey to authentic professional fulfillment starts here.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Start Your Trinity Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </SignedOut>
      </div>
    </div>
  )
}