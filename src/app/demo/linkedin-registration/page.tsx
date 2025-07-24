'use client';

import React from 'react';
import Link from 'next/link';
import { Linkedin, Sparkles, Network, Brain, TrendingUp, CheckCircle } from 'lucide-react';

export default function LinkedInRegistrationDemo() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            LinkedIn &quot;Shock &amp; Awe&quot; Registration
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Transform your LinkedIn profile into a multi-dimensional professional journey with AI-powered insights and stunning visualizations
          </p>
        </div>

        {/* Demo Note */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-yellow-400">Demo Note</h3>
          </div>
          <p className="text-gray-300">
            This is a demonstration of the enhanced LinkedIn registration flow. The full experience with advanced scraping 
            requires Apify API configuration. You can test the basic flow at{' '}
            <Link href="/register/linkedin" className="text-blue-400 hover:text-blue-300">
              /register/linkedin
            </Link>
          </p>
        </div>

        {/* Demo Flow */}
        <div className="space-y-24">
          {/* Enhanced Registration Flow */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-1">
            <div className="bg-gray-900 rounded-2xl p-8">
              <h2 className="text-3xl font-bold mb-6 text-center">
                The &quot;Shock &amp; Awe&quot; Journey
              </h2>
              
              {/* Flow Steps */}
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">1. Simple LinkedIn Input</h3>
                    <p className="text-gray-400 mb-4">
                      Users simply paste their LinkedIn URL. Our system handles the rest - no manual data entry required.
                    </p>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <input
                        type="text"
                        value="https://linkedin.com/in/yourprofile"
                        readOnly
                        className="w-full px-4 py-2 bg-gray-700 rounded text-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">2. Instant Profile Analysis</h3>
                    <p className="text-gray-400 mb-4">
                      AI analyzes career patterns, calculates metrics, and generates personalized insights.
                    </p>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Experience:</span>
                          <span className="text-white font-medium ml-2">8 years</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Companies:</span>
                          <span className="text-white font-medium ml-2">4</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Skills:</span>
                          <span className="text-white font-medium ml-2">24</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Level:</span>
                          <span className="text-white font-medium ml-2">Senior</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">3. The &quot;Shock&quot; Moment</h3>
                  <p className="text-gray-400">
                    Watch as their professional network explodes into a 3D visualization, 
                    showing connections, companies, skills, and opportunities in an 
                    interactive force-directed graph. This is where users realize 
                    Quest is unlike anything they&apos;ve seen before.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Brain className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="font-semibold mb-2">Smart Analysis</h4>
                    <p className="text-sm text-gray-400">AI identifies career patterns and growth trajectory</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Network className="w-8 h-8 text-green-400" />
                    </div>
                    <h4 className="font-semibold mb-2">3D Network</h4>
                    <p className="text-sm text-gray-400">Interactive visualization of professional connections</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-purple-400" />
                    </div>
                    <h4 className="font-semibold mb-2">Trinity Insights</h4>
                    <p className="text-sm text-gray-400">AI-generated professional identity analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trinity Generation Demo */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-8 border border-gray-700">
            <div className="text-center mb-8">
              <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold">Trinity Identity Generated</h2>
              <p className="text-gray-400 mt-2">Three eternal questions that define professional purpose</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Quest</h3>
                <p className="text-blue-100">&quot;Building products and teams that democratize access to technology and empower creators worldwide&quot;</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Service</h3>
                <p className="text-purple-100">&quot;Bridging technical excellence with strategic vision to transform ideas into impactful solutions&quot;</p>
              </div>
              <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Pledge</h3>
                <p className="text-green-100">&quot;To build with integrity, mentor the next generation, and leave every codebase and team better than I found it&quot;</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-6">Ready to Experience It?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Transform your LinkedIn profile into a powerful Quest identity
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register/linkedin"
                className="px-8 py-4 bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Linkedin className="w-5 h-5" />
                Try LinkedIn Registration
              </Link>
              <Link
                href="/admin/test-scraping"
                className="px-8 py-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
              >
                Test Scraping Backend
              </Link>
            </div>
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="mt-24 border-t border-gray-800 pt-12">
          <h3 className="text-2xl font-semibold mb-8">Technical Implementation</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-3">LinkedIn Scraping</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Apify integration with Quest scrapers</li>
                <li>• Residential proxies for reliability</li>
                <li>• Sub-30 second processing</li>
                <li>• Robust error handling</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-3">AI Analysis</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• GPT-4 for Trinity generation</li>
                <li>• Pattern recognition algorithms</li>
                <li>• Career trajectory analysis</li>
                <li>• Skill relationship mapping</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-3">Visualization</h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• React Force Graph 3D</li>
                <li>• Real-time network mapping</li>
                <li>• Interactive node exploration</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}