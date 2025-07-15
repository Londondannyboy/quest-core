'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const timelineVariants = [
  {
    id: 'debug-timeline',
    name: 'Simple Debug Timeline',
    description: 'Basic 4-node test with fixed positions',
    features: ['Fixed positioning', 'Simple test data', 'Red timeline axis', 'Clear year labels'],
    url: '/debug-timeline',
    color: 'bg-red-500/20 border-red-500/30'
  },
  {
    id: 'test-force',
    name: 'Force-Based Timeline',
    description: 'Natural physics simulation with organic clustering',
    features: ['13 nodes with rich connections', 'Natural physics forces', 'Organic node clustering', 'Dynamic positioning'],
    url: '/test-force',
    color: 'bg-blue-500/20 border-blue-500/30'
  },
  {
    id: 'test-fixed',
    name: 'Fixed Column Timeline',
    description: 'Strict year-based columns with vertical separators',
    features: ['Year-based columns', 'Fixed node positions', 'Vertical separators', 'Clear temporal progression'],
    url: '/test-fixed',
    color: 'bg-green-500/20 border-green-500/30'
  },
  {
    id: 'test-circular',
    name: 'Circular Timeline',
    description: 'Years as concentric rings with type-based layers',
    features: ['Concentric year rings', 'Type-based Z layers', 'Radial progression', 'Ring visual effects'],
    url: '/test-circular',
    color: 'bg-purple-500/20 border-purple-500/30'
  },
  {
    id: 'test-spiral',
    name: 'Spiral Timeline',
    description: 'Time flows in continuous 3D spiral',
    features: ['3D spiral flow', '17 chronological events', 'Continuous time progression', 'Height-based timeline'],
    url: '/test-spiral',
    color: 'bg-yellow-500/20 border-yellow-500/30'
  },
  {
    id: 'test-background',
    name: 'Animated Background Demo',
    description: 'Temporal background effects with color-coded time progression',
    features: ['Gradient background plane', 'Color-coded particle flow', 'Time zone indicators', 'Animated wave effects'],
    url: '/test-background',
    color: 'bg-orange-500/20 border-orange-500/30'
  },
  {
    id: 'visualization',
    name: 'Main Temporal Timeline',
    description: 'Our revolutionary horizontal temporal knowledge graph',
    features: ['Horizontal year frames', 'Floating date labels', 'Visual year planes', 'Custom temporal system'],
    url: '/visualization',
    color: 'bg-cyan-500/20 border-cyan-500/30'
  }
];

export default function TimelineComparison() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Timeline Visualization Comparison
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Explore different approaches to 3D temporal knowledge graphs
          </p>
          <div className="text-sm text-gray-400">
            <p>🚀 Built with react-force-graph-3d + Three.js + Neo4j</p>
            <p>🎯 Revolutionary temporal positioning algorithms</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {timelineVariants.map((variant) => (
            <Card key={variant.id} className={`${variant.color} backdrop-blur-sm`}>
              <CardHeader>
                <CardTitle className="text-white text-xl">{variant.name}</CardTitle>
                <p className="text-gray-300 text-sm">{variant.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {variant.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-200">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      {feature}
                    </div>
                  ))}
                </div>
                <Link href={variant.url}>
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">
                    View Timeline
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl">🔬 Testing Approach</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Data Sources</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Debug:</strong> Simple 4-node test data</li>
                  <li>• <strong>Force:</strong> 13 nodes with rich connections</li>
                  <li>• <strong>Fixed:</strong> 12 nodes in strict columns</li>
                  <li>• <strong>Circular:</strong> Generated concentric data</li>
                  <li>• <strong>Spiral:</strong> 17 chronological events</li>
                  <li>• <strong>Main:</strong> Rich test user timeline</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Comparison Criteria</h3>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Clarity:</strong> How clear is the temporal progression?</li>
                  <li>• <strong>Scalability:</strong> How well does it handle more data?</li>
                  <li>• <strong>Aesthetics:</strong> Visual appeal and engagement</li>
                  <li>• <strong>Usability:</strong> Navigation and interaction quality</li>
                  <li>• <strong>Innovation:</strong> Uniqueness of the approach</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-2xl">📊 API Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-white mb-2">Debug Data</h4>
                <code className="bg-black/30 px-2 py-1 rounded">/api/debug/temporal-timeline</code>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Rich Test Data</h4>
                <code className="bg-black/30 px-2 py-1 rounded">/api/debug/rich-timeline</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}