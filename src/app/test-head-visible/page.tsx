'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading 3D Graph...</div>
});

export default function TestHeadVisible() {
  const forceGraphRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Simple test data
  const graphData = {
    nodes: [
      { id: 'exec', name: 'Executive', type: 'executive', val: 20, color: '#dc2626' },
      { id: 'dev', name: 'Developer', type: 'developer', val: 15, color: '#16a34a' },
      { id: 'designer', name: 'Designer', type: 'designer', val: 12, color: '#ca8a04' }
    ],
    links: [
      { source: 'exec', target: 'dev' },
      { source: 'exec', target: 'designer' }
    ]
  };

  // Professional isometric head geometry for testing
  const createIsometricTestHead = (size = 1, role = 'default') => {
    const THREE = (window as any).THREE;
    if (!THREE) return null;

    const group = new THREE.Group();

    // Professional color palette for testing
    const colorPalette = {
      primary: 0x2C3E50,    // Deep blue-gray
      secondary: 0x34495E,  // Darker blue-gray
      accent: 0x3498DB,     // Professional blue
      neutral: 0x95A5A6,    // Light gray
      highlight: 0xE74C3C   // Professional red
    };

    // Base isometric head - geometric cube design
    const headGeometry = new THREE.BoxGeometry(size * 1.2, size * 1.4, size * 1.0);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: colorPalette.primary,
      transparent: true,
      opacity: 0.9,
      shininess: 30
    });
    
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = size * 0.1;
    group.add(headMesh);

    // Professional wireframe overlay
    const wireframeGeometry = new THREE.EdgesGeometry(headGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: colorPalette.accent,
      transparent: true,
      opacity: 0.4
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

  // Create head geometry with new isometric styling
  const createHeadNode = (node: any) => {
    const THREE = (window as any).THREE;
    if (!THREE) {
      console.log('THREE.js not available for node:', node.id);
      return null;
    }

    console.log('Creating isometric head node for:', node.name, 'type:', node.type);

    const group = new THREE.Group();
    
    // Role-specific color palettes
    const rolePalettes = {
      executive: { primary: 0x8E44AD, secondary: 0x9B59B6, accent: 0xF1C40F },
      developer: { primary: 0x27AE60, secondary: 0x2ECC71, accent: 0x16A085 },
      designer: { primary: 0xE67E22, secondary: 0xF39C12, accent: 0xE74C3C }
    };

    const nodeColors = rolePalettes[node.type as keyof typeof rolePalettes] || rolePalettes.developer;
    
    // Base isometric head for all roles
    const baseHead = createIsometricTestHead(node.val * 0.06, node.type);
    if (baseHead) {
      // Apply role-specific coloring
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

    // Add role-specific accessories with new geometric approach
    switch (node.type) {
      case 'executive':
        // Geometric crown - hexagonal prism
        const crownGeometry = new THREE.ConeGeometry(node.val * 0.8, node.val * 0.4, 6);
        const crownMaterial = new THREE.MeshPhongMaterial({ 
          color: nodeColors.accent, 
          transparent: true, 
          opacity: 0.8,
          shininess: 100
        });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = node.val * 1.2;
        crown.rotation.y = Math.PI / 6;
        group.add(crown);
        break;
        
      case 'developer':
        // Tech HUD interface
        const screenGeometry = new THREE.PlaneGeometry(0.8, 0.6);
        const screenMaterial = new THREE.MeshPhongMaterial({ 
          color: nodeColors.accent, 
          transparent: true, 
          opacity: 0.7
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.2, node.val * 0.8);
        group.add(screen);

        // Code blocks
        for (let i = 0; i < 3; i++) {
          const blockGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.02);
          const blockMaterial = new THREE.MeshPhongMaterial({ color: nodeColors.secondary });
          const block = new THREE.Mesh(blockGeometry, blockMaterial);
          block.position.set(-0.2 + i * 0.2, 0.15 + i * 0.1, node.val * 0.81);
          group.add(block);
        }
        break;
        
      case 'designer':
        // Color palette
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
    }

    console.log('Isometric head node created successfully for:', node.name);
    return group;
  };

  useEffect(() => {
    const initForceGraph = async () => {
      try {
        const THREE = await import('three');
        (window as any).THREE = THREE;
        console.log('THREE.js loaded and available globally');
        setIsLoaded(true);
        
        // Set camera position after a delay
        setTimeout(() => {
          if (forceGraphRef.current) {
            forceGraphRef.current.cameraPosition({ x: 0, y: 0, z: 300 });
          }
        }, 2000);
      } catch (error) {
        console.error('Error loading THREE.js:', error);
      }
    };

    initForceGraph();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Professional Isometric Head Test</h1>
          <p className="text-gray-600 mt-2">
            Testing professional isometric head nodes with geometric styling and wireframe overlays
          </p>
          {isLoaded && (
            <div className="mt-2 text-green-600">
              ✓ THREE.js loaded successfully - Isometric geometry ready
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Professional Isometric Network Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[600px] bg-gray-900 rounded-lg">
              <ForceGraph3D
                ref={forceGraphRef}
                graphData={graphData}
                nodeThreeObject={createHeadNode}
                nodeThreeObjectExtend={true}
                linkColor={() => '#ffffff'}
                linkOpacity={0.8}
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
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              {graphData.nodes.map((node) => (
                <div key={node.id} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{node.type}</Badge>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                  </div>
                  <p className="text-sm font-medium">{node.name}</p>
                  <p className="text-xs text-gray-600">Isometric Box + Wireframe</p>
                  <p className="text-xs text-gray-500">Professional Geometry</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}