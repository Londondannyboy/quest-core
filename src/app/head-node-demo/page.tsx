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

  // Professional isometric head geometry - gender/racial neutral
  const createIsometricHeadGeometry = (size = 1, role = 'default') => {
    const THREE = (window as any).THREE;
    if (!THREE) {
      console.log('THREE.js not available for head geometry creation');
      return null;
    }

    const group = new THREE.Group();

    // Professional color palette
    const colorPalette = {
      primary: 0x2C3E50,    // Deep blue-gray
      secondary: 0x34495E,  // Darker blue-gray
      accent: 0x3498DB,     // Professional blue
      neutral: 0x95A5A6,    // Light gray
      highlight: 0xE74C3C   // Professional red
    };

    // Base head - geometric isometric style using rounded box
    const headGeometry = new THREE.BoxGeometry(size * 1.2, size * 1.4, size * 1.0);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: colorPalette.primary,
      transparent: true,
      opacity: 0.9,
      shininess: 30
    });
    
    // Round the edges using EdgesGeometry for professional look
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = size * 0.1;
    group.add(headMesh);

    // Add subtle wireframe overlay for professional tech aesthetic
    const wireframeGeometry = new THREE.EdgesGeometry(headGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: colorPalette.accent,
      transparent: true,
      opacity: 0.3
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.position.y = size * 0.1;
    group.add(wireframe);

    // Professional base platform
    const baseGeometry = new THREE.CylinderGeometry(size * 0.8, size * 0.8, size * 0.2, 8);
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: colorPalette.secondary,
      transparent: true,
      opacity: 0.8
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -size * 0.8;
    group.add(base);

    return group;
  };

  // Create professional isometric nodes based on role
  const createNodeObject = (node: any) => {
    const THREE = (window as any).THREE;
    if (!THREE) {
      console.log('THREE.js not available for node creation');
      return null;
    }

    const group = new THREE.Group();
    
    // Professional color palette
    const colorPalette = {
      executive: { primary: 0x8E44AD, secondary: 0x9B59B6, accent: 0xF1C40F }, // Purple with gold
      manager: { primary: 0x2980B9, secondary: 0x3498DB, accent: 0x1ABC9C },   // Blue with teal
      developer: { primary: 0x27AE60, secondary: 0x2ECC71, accent: 0x16A085 }, // Green with teal
      designer: { primary: 0xE67E22, secondary: 0xF39C12, accent: 0xE74C3C },  // Orange with red
      intern: { primary: 0x7F8C8D, secondary: 0x95A5A6, accent: 0x3498DB }     // Gray with blue
    };

    const nodeColors = colorPalette[node.type as keyof typeof colorPalette] || colorPalette.developer;
    
    // Base isometric head for all roles
    const baseHead = createIsometricHeadGeometry(node.val * 0.06, node.type);
    if (baseHead) {
      // Apply role-specific coloring to base head
      baseHead.children.forEach((child: any) => {
        if (child.material) {
          if (child.type === 'Mesh') {
            child.material.color.setHex(nodeColors.primary);
          } else if (child.type === 'LineSegments') {
            child.material.color.setHex(nodeColors.accent);
          }
        }
      });
      group.add(baseHead);
    }
    
    switch (node.type) {
      case 'executive':
        // Executive crown - geometric diamond pattern
        const crownGeometry = new THREE.ConeGeometry(node.val * 0.8, node.val * 0.4, 6);
        const crownMaterial = new THREE.MeshPhongMaterial({ 
          color: nodeColors.accent, 
          transparent: true, 
          opacity: 0.8,
          shininess: 100
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = node.val * 1.2;
        crown.rotation.y = Math.PI / 6; // Slight rotation for dynamics
        group.add(crown);

        // Executive ring indicators
        for (let i = 0; i < 3; i++) {
          const ringGeometry = new THREE.RingGeometry(
            node.val * (0.9 + i * 0.2), 
            node.val * (1.0 + i * 0.2), 
            16
          );
          const ringMaterial = new THREE.MeshPhongMaterial({ 
            color: nodeColors.accent, 
            transparent: true, 
            opacity: 0.3 - i * 0.1
          });
          const ring = new THREE.Mesh(ringGeometry, ringMaterial);
          ring.rotation.x = -Math.PI / 2;
          ring.position.y = node.val * 1.3 + i * 0.1;
          group.add(ring);
        }
        break;
        
      case 'manager':
        // Manager badge - professional hexagonal badge
        const badgeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 6);
        const badgeMaterial = new THREE.MeshPhongMaterial({ 
          color: nodeColors.accent,
          shininess: 50
        });
        const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
        badge.position.set(0, -node.val * 0.3, node.val * 0.7);
        badge.rotation.y = Math.PI / 6;
        group.add(badge);

        // Authority indicators - corner markers
        for (let i = 0; i < 4; i++) {
          const markerGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
          const markerMaterial = new THREE.MeshPhongMaterial({ color: nodeColors.secondary });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          const angle = (i / 4) * Math.PI * 2;
          marker.position.set(
            Math.cos(angle) * node.val * 0.8,
            node.val * 0.2,
            Math.sin(angle) * node.val * 0.8
          );
          group.add(marker);
        }
        break;
        
      case 'developer':
        // Developer interface elements - geometric HUD
        const screenGeometry = new THREE.PlaneGeometry(0.8, 0.6);
        const screenMaterial = new THREE.MeshPhongMaterial({ 
          color: nodeColors.accent, 
          transparent: true, 
          opacity: 0.7
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.2, node.val * 0.8);
        group.add(screen);

        // Code blocks visualization
        for (let i = 0; i < 3; i++) {
          const blockGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.02);
          const blockMaterial = new THREE.MeshPhongMaterial({ color: nodeColors.secondary });
          const block = new THREE.Mesh(blockGeometry, blockMaterial);
          block.position.set(-0.2 + i * 0.2, 0.15 + i * 0.1, node.val * 0.81);
          group.add(block);
        }
        break;
        
      case 'designer':
        // Designer creative geometry - artistic floating elements
        const paletteGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
        const paletteMaterial = new THREE.MeshPhongMaterial({ color: nodeColors.primary });
        const palette = new THREE.Mesh(paletteGeometry, paletteMaterial);
        palette.position.set(-0.6, 0.3, 0.4);
        palette.rotation.z = Math.PI / 6;
        group.add(palette);

        // Color swatches
        const colors = [nodeColors.accent, nodeColors.secondary, 0xF39C12, 0xE74C3C];
        colors.forEach((color, i) => {
          const swatchGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.02);
          const swatchMaterial = new THREE.MeshPhongMaterial({ color });
          const swatch = new THREE.Mesh(swatchGeometry, swatchMaterial);
          swatch.position.set(
            0.5 + (i % 2) * 0.15,
            0.4 + Math.floor(i / 2) * 0.15,
            0.3
          );
          group.add(swatch);
        });
        break;
        
      case 'intern':
        // Intern learning indicators - progress elements
        const bookGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.05);
        const bookMaterial = new THREE.MeshPhongMaterial({ color: nodeColors.accent });
        const book = new THREE.Mesh(bookGeometry, bookMaterial);
        book.position.set(0.4, 0, 0.4);
        book.rotation.y = Math.PI / 4;
        group.add(book);

        // Progress bars
        for (let i = 0; i < 3; i++) {
          const barGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.02);
          const barMaterial = new THREE.MeshPhongMaterial({ 
            color: nodeColors.secondary,
            transparent: true,
            opacity: 0.8
          });
          const bar = new THREE.Mesh(barGeometry, barMaterial);
          bar.position.set(0, -0.3 - i * 0.1, 0.5);
          group.add(bar);

          // Progress fill
          const fillGeometry = new THREE.BoxGeometry(0.4 * (0.3 + i * 0.2), 0.02, 0.02);
          const fillMaterial = new THREE.MeshPhongMaterial({ color: nodeColors.accent });
          const fill = new THREE.Mesh(fillGeometry, fillMaterial);
          fill.position.set(-0.2 + (0.4 * (0.3 + i * 0.2)) / 2, -0.3 - i * 0.1, 0.51);
          group.add(fill);
        }
        break;
        
      default:
        // Professional default node
        const defaultHead = createIsometricHeadGeometry(node.val * 0.06, 'default');
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
      console.log('THREE.js loaded and available globally');
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
    executive: { icon: '💎', description: 'Isometric head with geometric crown and authority rings', color: '#8E44AD' },
    manager: { icon: '⬡', description: 'Professional head with hexagonal badge and corner markers', color: '#2980B9' },
    developer: { icon: '📟', description: 'Tech head with HUD interface and code block visualization', color: '#27AE60' },
    designer: { icon: '🎨', description: 'Creative head with color palette and artistic swatches', color: '#E67E22' },
    intern: { icon: '📚', description: 'Learning head with progress bars and knowledge indicators', color: '#7F8C8D' }
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
                  <h4 className="font-medium">Isometric Design:</h4>
                  <p className="text-xs text-gray-600">
                    Gender/racial neutral geometric heads using BoxGeometry with professional wireframe overlays
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Role Indicators:</h4>
                  <p className="text-xs text-gray-600">
                    Abstract geometric accessories: crowns, HUD elements, progress bars, color palettes
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Professional Materials:</h4>
                  <p className="text-xs text-gray-600">
                    MeshPhongMaterial with role-based color palettes, transparency, and shininess effects
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
                <h4 className="font-medium mb-2">Isometric Head Creation:</h4>
                <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
{`const createIsometricHeadGeometry = (size, role) => {
  const group = new THREE.Group();
  
  // Professional geometric head base
  const headGeometry = new THREE.BoxGeometry(
    size * 1.2, size * 1.4, size * 1.0
  );
  const headMaterial = new THREE.MeshPhongMaterial({
    color: colorPalette.primary,
    transparent: true,
    opacity: 0.9,
    shininess: 30
  });
  
  // Add wireframe overlay for tech aesthetic
  const wireframeGeometry = new THREE.EdgesGeometry(headGeometry);
  const wireframe = new THREE.LineSegments(
    wireframeGeometry, 
    wireframeMaterial
  );
  
  return group;
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