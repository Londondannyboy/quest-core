'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Settings, 
  Eye,
  Triangle,
  Circle,
  Hexagon
} from 'lucide-react';
import TrinityVisualization3D from '@/components/trinity/TrinityVisualization3D';

export default function TrinityVisualizationTest() {
  const [showLabels, setShowLabels] = useState(true);
  const [showFace, setShowFace] = useState(false);
  const [currentSize, setCurrentSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Sample trinity data for testing
  const sampleTrinityData = {
    quest: "Building innovative solutions that solve real-world problems and create meaningful impact",
    service: "Mentoring developers and fostering collaborative environments where teams thrive",
    pledge: "To deliver exceptional code quality while maintaining work-life balance and continuous learning"
  };

  const emptyTrinityData = {
    quest: "",
    service: "", 
    pledge: ""
  };

  // Trinity characteristics variations for testing
  const characteristicVariations = [
    {
      name: "Aggressive Builder",
      characteristics: { questType: 'aggressive' as const, serviceType: 'individual' as const, pledgeType: 'ambitious' as const, intensity: 'high' as const }
    },
    {
      name: "Peaceful Mentor", 
      characteristics: { questType: 'peaceful' as const, serviceType: 'collective' as const, pledgeType: 'steady' as const, intensity: 'medium' as const }
    },
    {
      name: "Balanced Systems Thinker",
      characteristics: { questType: 'balanced' as const, serviceType: 'systemic' as const, pledgeType: 'adaptive' as const, intensity: 'low' as const }
    },
    {
      name: "Default (No Characteristics)",
      characteristics: undefined
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          Trinity Visualization Test
        </h1>
        <p className="text-gray-600 mt-2">
          Professional 3D trinity visualization for individual onboarding with sacred geometry
        </p>
      </div>

      <Tabs defaultValue="visualization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visualization">3D Visualization</TabsTrigger>
          <TabsTrigger value="characteristics">Characteristics</TabsTrigger>
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="integration">Integration Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="visualization" className="space-y-6">
          {/* Main Visualization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Triangle className="h-5 w-5" />
                  Interactive Trinity Visualization
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showLabels ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowLabels(!showLabels)}
                  >
                    <Eye className="h-4 w-4" />
                    Labels
                  </Button>
                  <Button
                    variant={showFace ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFace(!showFace)}
                  >
                    <Circle className="h-4 w-4" />
                    Face
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TrinityVisualization3D
                trinityData={sampleTrinityData}
                trinityCharacteristics={characteristicVariations[1].characteristics}
                size={currentSize}
                showLabels={showLabels}
                showFace={showFace}
                className="mb-4"
              />
              
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Size:</span>
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={currentSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentSize(size)}
                      className="capitalize"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">With Trinity Data</CardTitle>
              </CardHeader>
              <CardContent>
                <TrinityVisualization3D
                  trinityData={sampleTrinityData}
                  size="small"
                  showLabels={true}
                  showFace={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Empty State</CardTitle>
              </CardHeader>
              <CardContent>
                <TrinityVisualization3D
                  trinityData={emptyTrinityData}
                  size="small"
                  showLabels={true}
                  showFace={false}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="characteristics" className="space-y-6">
          {/* Trinity Characteristic Variations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Trinity Characteristic Variations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-6">
                Different trinity characteristics produce unique color palettes and animation intensities, 
                allowing for personalized visualization based on individual traits.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {characteristicVariations.map((variation, index) => (
                  <Card key={index} className="p-4">
                    <div className="mb-3">
                      <h3 className="font-medium text-lg">{variation.name}</h3>
                      {variation.characteristics && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Quest: {variation.characteristics.questType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Service: {variation.characteristics.serviceType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Pledge: {variation.characteristics.pledgeType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Intensity: {variation.characteristics.intensity}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <TrinityVisualization3D
                      trinityData={sampleTrinityData}
                      trinityCharacteristics={variation.characteristics}
                      size="small"
                      showLabels={false}
                      showFace={false}
                    />
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color System Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Color System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Quest Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <span className="text-sm"><strong>Aggressive:</strong> Bold, action-oriented (Red)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="text-sm"><strong>Peaceful:</strong> Calm, thoughtful (Blue)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                      <span className="text-sm"><strong>Balanced:</strong> Harmony-focused (Purple)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Service Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm"><strong>Individual:</strong> Personal focus (Emerald)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                      <span className="text-sm"><strong>Collective:</strong> Community focus (Green)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-800 rounded-full"></div>
                      <span className="text-sm"><strong>Systemic:</strong> Systems thinking (Dark Green)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Pledge Types</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span className="text-sm"><strong>Ambitious:</strong> High energy (Orange)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-amber-600 rounded-full"></div>
                      <span className="text-sm"><strong>Steady:</strong> Consistent (Amber)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-600 rounded-full"></div>
                      <span className="text-sm"><strong>Adaptive:</strong> Flexible (Yellow)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Feature Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Features & Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">3D Elements</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-quest-500 rounded-full"></div>
                        <span><strong>Quest:</strong> Icosahedron (exploration/discovery)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-service-500 rounded-full"></div>
                        <span><strong>Service:</strong> Cylinder (stability/foundation)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-pledge-500 rounded-full"></div>
                        <span><strong>Pledge:</strong> Octahedron (commitment/action)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Sacred Geometry</h4>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Triangle:</strong> Connecting all three elements</div>
                      <div>• <strong>Circle:</strong> Outer boundary for completion</div>
                      <div>• <strong>Proportions:</strong> Golden ratio spacing</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Animations</h4>
                    <div className="space-y-2 text-sm">
                      <div>• <strong>Quest:</strong> Floating and gentle rotation</div>
                      <div>• <strong>Service:</strong> Heartbeat pulsing pattern</div>
                      <div>• <strong>Pledge:</strong> Sharp rotation and intensity</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Size Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Size Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Small</Badge>
                      <span className="text-sm">300px - Compact integration</span>
                    </div>
                    <TrinityVisualization3D
                      size="small"
                      showLabels={false}
                      showFace={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hexagon className="h-5 w-5" />
                Integration Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Onboarding Integration</h3>
                  <div className="space-y-3 text-sm">
                    <p>
                      The TrinityVisualization3D component is designed for seamless integration into the Quest Core onboarding flow:
                    </p>
                    <ul className="space-y-2 ml-4">
                      <li>• <strong>Step 1:</strong> Empty state during trinity discovery</li>
                      <li>• <strong>Step 2:</strong> Progressive reveal as user completes each element</li>
                      <li>• <strong>Step 3:</strong> Full visualization with personal trinity data</li>
                      <li>• <strong>Step 4:</strong> Optional face overlay for deeper personalization</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Technical Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-medium">Performance</h4>
                      <ul className="space-y-1 ml-4">
                        <li>• Dynamic Three.js loading</li>
                        <li>• Efficient geometry</li>
                        <li>• Optimized animations</li>
                        <li>• Responsive sizing</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium">Accessibility</h4>
                      <ul className="space-y-1 ml-4">
                        <li>• Color contrast compliant</li>
                        <li>• Screen reader friendly</li>
                        <li>• Keyboard navigation</li>
                        <li>• Reduced motion support</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Usage Example:</h4>
                  <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`<TrinityVisualization3D
  trinityData={{
    quest: "Your quest statement...",
    service: "Your service statement...", 
    pledge: "Your pledge statement..."
  }}
  size="medium"
  showLabels={true}
  showFace={false}
  className="my-4"
/>`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}