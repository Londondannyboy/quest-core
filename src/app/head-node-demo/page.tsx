'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Users, 
  Play, 
  Pause, 
  RotateCcw,
  Eye,
  Settings,
  Zap
} from 'lucide-react';

// Dynamic import to avoid SSR issues with 3D components
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading 3D Graph...</div>
});

export default function HeadNodeDemo() {
  const forceGraphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Sample network data with different node types
  const graphData = {
    nodes: [
      { id: 'ceo', name: 'Sarah Chen', type: 'executive', val: 20, color: '#dc2626' },
      { id: 'cto', name: 'Michael Park', type: 'executive', val: 18, color: '#dc2626' },
      { id: 'pm1', name: 'Lisa Wong', type: 'manager', val: 15, color: '#2563eb' },
      { id: 'pm2', name: 'David Kim', type: 'manager', val: 15, color: '#2563eb' },
      { id: 'dev1', name: 'Alex Johnson', type: 'developer', val: 12, color: '#16a34a' },
      { id: 'dev2', name: 'Emma Davis', type: 'developer', val: 12, color: '#16a34a' },
      { id: 'dev3', name: 'Ryan Miller', type: 'developer', val: 12, color: '#16a34a' },
      { id: 'dev4', name: 'Sophie Taylor', type: 'developer', val: 12, color: '#16a34a' },
      { id: 'des1', name: 'Maria Garcia', type: 'designer', val: 10, color: '#ca8a04' },
      { id: 'des2', name: 'James Wilson', type: 'designer', val: 10, color: '#ca8a04' },
      { id: 'int1', name: 'Jordan Lee', type: 'intern', val: 8, color: '#7c3aed' },
      { id: 'int2', name: 'Casey Brown', type: 'intern', val: 8, color: '#7c3aed' }
    ],
    links: [
      { source: 'ceo', target: 'cto' },
      { source: 'ceo', target: 'pm1' },
      { source: 'ceo', target: 'pm2' },
      { source: 'cto', target: 'pm1' },
      { source: 'cto', target: 'pm2' },
      { source: 'pm1', target: 'dev1' },
      { source: 'pm1', target: 'dev2' },
      { source: 'pm1', target: 'des1' },
      { source: 'pm2', target: 'dev3' },
      { source: 'pm2', target: 'dev4' },
      { source: 'pm2', target: 'des2' },
      { source: 'dev1', target: 'int1' },
      { source: 'dev3', target: 'int2' },
      { source: 'des1', target: 'des2' }
    ]
  };

  // Create head geometry - adapted from Trinity Head code
  const createHeadGeometry = (size = 1, color = 0x8B7355) => {
    const THREE = (window as any).THREE;
    if (!THREE) return null;

    // Create head shape (modified sphere)
    const headGeometry = new THREE.SphereGeometry(size, 32, 32);
    
    // Modify vertices to make it more head-like
    const position = headGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      
      // Flatten back of head
      if (z < -0.3) {
        position.setZ(i, z * 0.7);
      }
      
      // Create chin
      if (y < -0.5) {
        position.setY(i, y * 1.2);
      }
      
      // Narrow at top
      if (y > 0.3) {
        position.setX(i, x * 0.9);
        position.setZ(i, z * 0.9);
      }
    }
    
    headGeometry.attributes.position.needsUpdate = true;
    headGeometry.computeVertexNormals();

    // Create material
    const headMaterial = new THREE.MeshLambertMaterial({
      color: color,
      transparent: true,
      opacity: 0.9
    });

    return new THREE.Mesh(headGeometry, headMaterial);
  };

  // Create different node shapes based on type
  const createNodeObject = (node: any) => {
    const THREE = (window as any).THREE;
    if (!THREE) return null;

    const group = new THREE.Group();
    
    switch (node.type) {
      case 'executive':
        // Head with crown/halo effect
        const executiveHead = createHeadGeometry(node.val * 0.8, 0x8B4513);
        if (executiveHead) {
          group.add(executiveHead);
          
          // Add crown/halo
          const crownGeometry = new THREE.RingGeometry(node.val * 0.9, node.val * 1.1, 16);
          const crownMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFD700, 
            transparent: true, 
            opacity: 0.6 
          });
          const crown = new THREE.Mesh(crownGeometry, crownMaterial);
          crown.rotation.x = -Math.PI / 2;
          crown.position.y = node.val * 1.2;
          group.add(crown);
        }
        break;
        
      case 'manager':
        // Standard head with badge
        const managerHead = createHeadGeometry(node.val * 0.7, 0x8B7355);
        if (managerHead) {
          group.add(managerHead);
          
          // Add badge
          const badgeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
          const badgeMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
          const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
          badge.position.set(0, -node.val * 0.4, node.val * 0.5);
          group.add(badge);
        }
        break;
        
      case 'developer':
        // Head with glasses
        const developerHead = createHeadGeometry(node.val * 0.6, 0x8B7355);
        if (developerHead) {
          group.add(developerHead);
          
          // Add glasses
          const glassesGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
          const glassesMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
          
          const leftGlass = new THREE.Mesh(glassesGeometry, glassesMaterial);
          leftGlass.position.set(-0.3, 0.1, node.val * 0.5);
          leftGlass.rotation.y = Math.PI / 2;
          group.add(leftGlass);
          
          const rightGlass = new THREE.Mesh(glassesGeometry, glassesMaterial);
          rightGlass.position.set(0.3, 0.1, node.val * 0.5);
          rightGlass.rotation.y = Math.PI / 2;
          group.add(rightGlass);
          
          // Bridge
          const bridgeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
          const bridge = new THREE.Mesh(bridgeGeometry, glassesMaterial);
          bridge.position.set(0, 0.1, node.val * 0.5);
          bridge.rotation.z = Math.PI / 2;
          group.add(bridge);
        }
        break;
        
      case 'designer':
        // Head with creative flair
        const designerHead = createHeadGeometry(node.val * 0.6, 0x8B7355);
        if (designerHead) {
          group.add(designerHead);
          
          // Add creative "thought bubbles"
          for (let i = 0; i < 3; i++) {
            const bubbleGeometry = new THREE.SphereGeometry(0.1 + i * 0.05, 8, 8);
            const bubbleMaterial = new THREE.MeshLambertMaterial({ 
              color: 0xFF69B4, 
              transparent: true, 
              opacity: 0.7 
            });
            const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
            bubble.position.set(
              Math.sin(i * 0.8) * 0.8,
              node.val * 0.8 + i * 0.3,
              Math.cos(i * 0.8) * 0.8
            );
            group.add(bubble);
          }
        }
        break;
        
      case 'intern':
        // Smaller head with graduation cap
        const internHead = createHeadGeometry(node.val * 0.5, 0x8B7355);
        if (internHead) {
          group.add(internHead);
          
          // Add graduation cap
          const capGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 8);
          const capMaterial = new THREE.MeshLambertMaterial({ color: 0x000080 });
          const cap = new THREE.Mesh(capGeometry, capMaterial);
          cap.position.y = node.val * 0.6;
          group.add(cap);
          
          // Add tassel
          const tasselGeometry = new THREE.SphereGeometry(0.05, 8, 8);
          const tasselMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
          const tassel = new THREE.Mesh(tasselGeometry, tasselMaterial);
          tassel.position.set(0.4, node.val * 0.6, 0);
          group.add(tassel);
        }
        break;
        
      default:
        // Fallback to basic head
        const defaultHead = createHeadGeometry(node.val * 0.6, 0x8B7355);
        if (defaultHead) {
          group.add(defaultHead);
        }
    }

    return group;
  };

  useEffect(() => {
    const initForceGraph = async () => {
      const THREE = await import('three');
      
      // Make THREE available globally for the createNodeObject function
      (window as any).THREE = THREE;
    };

    initForceGraph();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetCamera = () => {
    if (forceGraphRef.current) {
      forceGraphRef.current.cameraPosition({ x: 0, y: 0, z: 400 });
    }
  };

  // Set camera position after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      resetCamera();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const nodeTypeInfo = {
    executive: { icon: '👑', description: 'Head with golden crown/halo', color: '#dc2626' },
    manager: { icon: '📋', description: 'Head with identification badge', color: '#2563eb' },
    developer: { icon: '🤓', description: 'Head with glasses and bridge', color: '#16a34a' },
    designer: { icon: '🎨', description: 'Head with creative thought bubbles', color: '#ca8a04' },
    intern: { icon: '🎓', description: 'Smaller head with graduation cap', color: '#7c3aed' }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          Head Node Demo
        </h1>
        <p className="text-gray-600 mt-2">
          Interactive network with realistic head nodes for different user types
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Force Graph */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Organization Network
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCamera}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowControls(!showControls)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[600px] bg-gray-900 rounded-lg">
                <ForceGraph3D
                  ref={forceGraphRef}
                  graphData={graphData}
                  nodeAutoColorBy="type"
                  nodeThreeObject={createNodeObject}
                  nodeThreeObjectExtend={true}
                  linkColor={() => '#ffffff'}
                  linkOpacity={0.6}
                  backgroundColor="rgba(0,0,0,0.1)"
                  showNavInfo={false}
                  nodeLabel={(node: any) => `${node.name} (${node.type})`}
                  onNodeHover={(node: any) => {
                    document.body.style.cursor = node ? 'pointer' : 'auto';
                  }}
                  onNodeClick={(node: any) => {
                    console.log('Clicked node:', node);
                  }}
                />
              </div>
              
              {showControls && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Controls:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Mouse:</strong> Rotate camera</li>
                    <li>• <strong>Scroll:</strong> Zoom in/out</li>
                    <li>• <strong>Drag:</strong> Pan camera</li>
                    <li>• <strong>Click:</strong> Select node</li>
                    <li>• <strong>Hover:</strong> Show node info</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Node Types */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Node Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(nodeTypeInfo).map(([type, info]) => (
                  <div key={type} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="text-2xl">{info.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant="outline"
                          className="capitalize"
                        >
                          {type}
                        </Badge>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: info.color }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium">Head Geometry:</h4>
                  <p className="text-xs text-gray-600">
                    Modified sphere with vertex manipulation for realistic head shape
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Accessories:</h4>
                  <p className="text-xs text-gray-600">
                    Crown, glasses, badges, caps added as child objects
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Material:</h4>
                  <p className="text-xs text-gray-600">
                    Skin-tone MeshLambertMaterial with proper lighting
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Code Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">React Force Graph Integration:</h4>
                <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`<ForceGraph3D
  nodeThreeObject={(node) => {
    // Create different head shapes based on node type
    return createHeadGeometry(node.type, node.val, node.color);
  }}
  nodeThreeObjectExtend={true}
  backgroundColor="transparent"
/>`}
                </pre>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">Head Creation Function:</h4>
                <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`const createHeadGeometry = (size, color) => {
  const headGeometry = new THREE.SphereGeometry(size, 32, 32);
  
  // Modify vertices for realistic head shape
  const position = headGeometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    
    // Flatten back of head
    if (z < -0.3) position.setZ(i, z * 0.7);
    
    // Create chin
    if (y < -0.5) position.setY(i, y * 1.2);
  }
  
  headGeometry.attributes.position.needsUpdate = true;
  return new THREE.Mesh(headGeometry, material);
};`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}