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

  // Create head geometry with bright lighting
  const createHeadNode = (node: any) => {
    const THREE = (window as any).THREE;
    if (!THREE) {
      console.log('THREE.js not available for node:', node.id);
      return null;
    }

    console.log('Creating head node for:', node.name, 'type:', node.type);

    const group = new THREE.Group();
    
    // Create head shape
    const headGeometry = new THREE.SphereGeometry(node.val * 0.8, 32, 32);
    
    // Modify vertices to make it head-like
    const position = headGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      
      if (z < -0.3) position.setZ(i, z * 0.7);
      if (y < -0.5) position.setY(i, y * 1.2);
      if (y > 0.3) {
        position.setX(i, x * 0.9);
        position.setZ(i, z * 0.9);
      }
    }
    
    headGeometry.attributes.position.needsUpdate = true;
    headGeometry.computeVertexNormals();

    // Bright head material
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B7355,
      transparent: false,
      opacity: 1.0
    });

    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    group.add(headMesh);

    // Add role-specific accessories
    switch (node.type) {
      case 'executive':
        // Crown
        const crownGeometry = new THREE.RingGeometry(node.val * 0.9, node.val * 1.1, 16);
        const crownMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.rotation.x = -Math.PI / 2;
        crown.position.y = node.val * 1.2;
        group.add(crown);
        break;
        
      case 'developer':
        // Glasses
        const glassGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
        const glassMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftGlass = new THREE.Mesh(glassGeometry, glassMaterial);
        leftGlass.position.set(-0.4, 0.1, node.val * 0.6);
        leftGlass.rotation.y = Math.PI / 2;
        group.add(leftGlass);
        
        const rightGlass = new THREE.Mesh(glassGeometry, glassMaterial);
        rightGlass.position.set(0.4, 0.1, node.val * 0.6);
        rightGlass.rotation.y = Math.PI / 2;
        group.add(rightGlass);
        break;
        
      case 'designer':
        // Creative bubbles
        for (let i = 0; i < 3; i++) {
          const bubbleGeometry = new THREE.SphereGeometry(0.1 + i * 0.05, 8, 8);
          const bubbleMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFF69B4, 
            transparent: true, 
            opacity: 0.8 
          });
          const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
          bubble.position.set(
            Math.sin(i * 0.8) * 0.8,
            node.val * 0.8 + i * 0.3,
            Math.cos(i * 0.8) * 0.8
          );
          group.add(bubble);
        }
        break;
    }

    console.log('Head node created successfully for:', node.name);
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
          <h1 className="text-3xl font-bold">Head Node Visibility Test</h1>
          <p className="text-gray-600 mt-2">
            Testing if head nodes are visible with improved lighting
          </p>
          {isLoaded && (
            <div className="mt-2 text-green-600">
              ✓ THREE.js loaded successfully
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organization Network with Head Nodes</CardTitle>
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
                  <p className="text-xs text-gray-600">Size: {node.val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}