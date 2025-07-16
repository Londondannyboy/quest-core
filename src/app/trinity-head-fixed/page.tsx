'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Brain, 
  Zap, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  Heart,
  Lightbulb,
  Target
} from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Trinity Head...</div>
});

// Simple data for the trinity elements
const trinityData = {
  nodes: [
    { id: 'mind', name: 'Mind', x: 0, y: 60, z: 0, color: '#4F46E5', type: 'mind' },
    { id: 'body', name: 'Body', x: -50, y: -30, z: 0, color: '#DC2626', type: 'body' },
    { id: 'spirit', name: 'Spirit', x: 50, y: -30, z: 0, color: '#059669', type: 'spirit' }
  ],
  links: [
    { source: 'mind', target: 'body' },
    { source: 'body', target: 'spirit' },
    { source: 'spirit', target: 'mind' }
  ]
};

export default function TrinityHeadFixedPage() {
  const graphRef = useRef<any>();
  const [isPlaying, setIsPlaying] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState([0.5]);
  const [trinityIntensity, setTrinityIntensity] = useState([1.0]);
  const [headOpacity, setHeadOpacity] = useState([0.3]);
  const [showControls, setShowControls] = useState(false);
  const [trinityState, setTrinityState] = useState({
    mind: { active: true, intensity: 1.0, color: '#4F46E5' },
    body: { active: true, intensity: 1.0, color: '#DC2626' },
    spirit: { active: true, intensity: 1.0, color: '#059669' }
  });

  // Set camera position after mount
  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  // Create head geometry with trinity elements
  const addTrinityHead = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    if (!THREE) {
      console.log('THREE.js not available, retrying in 1 second...');
      setTimeout(addTrinityHead, 1000);
      return;
    }

    const scene = graphRef.current.scene();
    
    // Remove existing head
    const existingHead = scene.getObjectByName('trinityHead');
    if (existingHead) scene.remove(existingHead);
    
    const headGroup = new THREE.Group();
    headGroup.name = 'trinityHead';
    
    // Create human head geometry
    const headGeometry = new THREE.SphereGeometry(80, 32, 32);
    
    // Modify geometry to be more head-like
    const headVertices = headGeometry.attributes.position;
    for (let i = 0; i < headVertices.count; i++) {
      const x = headVertices.getX(i);
      const y = headVertices.getY(i);
      const z = headVertices.getZ(i);
      
      // Flatten the back of the head
      if (z < -40) {
        headVertices.setZ(i, z * 0.7);
      }
      
      // Elongate slightly for chin
      if (y < -40) {
        headVertices.setY(i, y * 1.1);
      }
      
      // Narrow at top
      if (y > 24) {
        headVertices.setX(i, x * 0.9);
        headVertices.setZ(i, z * 0.9);
      }
    }
    headGeometry.attributes.position.needsUpdate = true;
    headGeometry.computeVertexNormals();

    // Head material
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B7355,
      transparent: true,
      opacity: headOpacity[0],
      wireframe: false,
      shininess: 30
    });

    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);

    // Add trinity elements inside the head
    const trinityGroup = new THREE.Group();
    
    // Mind (top) - Brain-like structure
    const mindGeometry = new THREE.IcosahedronGeometry(20, 2);
    const mindMaterial = new THREE.MeshPhongMaterial({
      color: 0x4F46E5,
      transparent: true,
      opacity: 0.9,
      emissive: 0x4F46E5,
      emissiveIntensity: 0.3
    });
    const mindMesh = new THREE.Mesh(mindGeometry, mindMaterial);
    mindMesh.position.set(0, 30, 0);
    trinityGroup.add(mindMesh);

    // Body (bottom left) - Geometric heart shape
    const bodyGeometry = new THREE.BoxGeometry(15, 15, 15);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xDC2626,
      transparent: true,
      opacity: 0.9,
      emissive: 0xDC2626,
      emissiveIntensity: 0.3
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.set(-25, -15, 0);
    trinityGroup.add(bodyMesh);

    // Spirit (bottom right) - Crystalline structure
    const spiritGeometry = new THREE.ConeGeometry(12, 30, 8);
    const spiritMaterial = new THREE.MeshPhongMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.9,
      emissive: 0x059669,
      emissiveIntensity: 0.3
    });
    const spiritMesh = new THREE.Mesh(spiritGeometry, spiritMaterial);
    spiritMesh.position.set(25, -15, 0);
    trinityGroup.add(spiritMesh);

    // Add connecting lines between trinity elements
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5
    });

    // Mind to Body line
    const mindToBodyGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 30, 0),
      new THREE.Vector3(-25, -15, 0)
    ]);
    const mindToBodyLine = new THREE.Line(mindToBodyGeometry, lineMaterial);
    trinityGroup.add(mindToBodyLine);

    // Body to Spirit line
    const bodyToSpiritGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-25, -15, 0),
      new THREE.Vector3(25, -15, 0)
    ]);
    const bodyToSpiritLine = new THREE.Line(bodyToSpiritGeometry, lineMaterial);
    trinityGroup.add(bodyToSpiritLine);

    // Spirit to Mind line
    const spiritToMindGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(25, -15, 0),
      new THREE.Vector3(0, 30, 0)
    ]);
    const spiritToMindLine = new THREE.Line(spiritToMindGeometry, lineMaterial);
    trinityGroup.add(spiritToMindLine);

    headGroup.add(trinityGroup);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Point lights for trinity elements
    const mindLight = new THREE.PointLight(0x4F46E5, 2, 200);
    mindLight.position.set(0, 50, 50);
    scene.add(mindLight);

    const bodyLight = new THREE.PointLight(0xDC2626, 2, 200);
    bodyLight.position.set(-50, -25, 50);
    scene.add(bodyLight);

    const spiritLight = new THREE.PointLight(0x059669, 2, 200);
    spiritLight.position.set(50, -25, 50);
    scene.add(spiritLight);

    scene.add(headGroup);

    // Animation loop
    const animate = () => {
      if (!isPlaying) return;
      
      const time = Date.now() * 0.001;
      
      // Animate trinity elements
      if (trinityGroup) {
        // Mind pulsing
        const mindMesh = trinityGroup.children[0];
        if (mindMesh && trinityState.mind.active) {
          mindMesh.scale.setScalar(1 + Math.sin(time * 2) * 0.1 * trinityIntensity[0]);
          mindMesh.material.emissiveIntensity = 0.3 + Math.sin(time * 2) * 0.1 * trinityIntensity[0];
        }
        
        // Body heartbeat
        const bodyMesh = trinityGroup.children[1];
        if (bodyMesh && trinityState.body.active) {
          bodyMesh.scale.setScalar(1 + Math.sin(time * 3) * 0.15 * trinityIntensity[0]);
          bodyMesh.material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.1 * trinityIntensity[0];
        }
        
        // Spirit rotation
        const spiritMesh = trinityGroup.children[2];
        if (spiritMesh && trinityState.spirit.active) {
          spiritMesh.rotation.y = time * 2 * trinityIntensity[0];
          spiritMesh.material.emissiveIntensity = 0.3 + Math.sin(time * 1.5) * 0.1 * trinityIntensity[0];
        }
      }
      
      // Update head opacity
      if (headGroup.children[0]) {
        headGroup.children[0].material.opacity = headOpacity[0];
      }
      
      // Rotate entire head group
      headGroup.rotation.y = time * rotationSpeed[0] * 0.1;
      
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetView = () => {
    setRotationSpeed([0.5]);
    setTrinityIntensity([1.0]);
    setHeadOpacity([0.3]);
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 });
    }
  };

  const toggleTrinityElement = (element: 'mind' | 'body' | 'spirit') => {
    setTrinityState(prev => ({
      ...prev,
      [element]: {
        ...prev[element],
        active: !prev[element].active
      }
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Trinity Head Visualization (Fixed)
        </h1>
        <p className="text-gray-600 mt-2">
          Fixed version using ForceGraph3D pattern - explore the trinity of mind, body, and spirit
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3D Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  3D Trinity Head
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetView}
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
                  ref={graphRef}
                  graphData={trinityData}
                  nodeLabel="name"
                  nodeColor="color"
                  nodeVal={0}
                  linkColor={() => 'rgba(255,255,255,0.1)'}
                  linkWidth={0}
                  backgroundColor="rgba(0,0,0,0.1)"
                  warmupTicks={0}
                  cooldownTicks={0}
                  cooldownTime={Infinity}
                  d3AlphaDecay={1}
                  d3VelocityDecay={1}
                  enableNavigationControls={true}
                  onEngineStop={() => {
                    setTimeout(() => {
                      addTrinityHead();
                    }, 500);
                  }}
                />
              </div>
              
              {showControls && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rotation Speed: {rotationSpeed[0]}
                    </label>
                    <Slider
                      value={rotationSpeed}
                      onValueChange={setRotationSpeed}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Trinity Intensity: {trinityIntensity[0]}
                    </label>
                    <Slider
                      value={trinityIntensity}
                      onValueChange={setTrinityIntensity}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Head Opacity: {headOpacity[0]}
                    </label>
                    <Slider
                      value={headOpacity}
                      onValueChange={setHeadOpacity}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Trinity Elements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Trinity Elements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium">Mind</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={trinityState.mind.active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleTrinityElement('mind')}
                    >
                      {trinityState.mind.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Body</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={trinityState.body.active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleTrinityElement('body')}
                    >
                      {trinityState.body.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Spirit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={trinityState.spirit.active ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleTrinityElement('spirit')}
                    >
                      {trinityState.spirit.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">About Trinity Head</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  This visualization represents the trinity of human consciousness within the head:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-indigo-500 mt-0.5" />
                    <span><strong>Mind:</strong> Consciousness, thought, and awareness</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="h-4 w-4 text-red-500 mt-0.5" />
                    <span><strong>Body:</strong> Physical sensation and embodiment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-green-500 mt-0.5" />
                    <span><strong>Spirit:</strong> Higher purpose and connection</span>
                  </li>
                </ul>
                <p>
                  Fixed version using the ForceGraph3D pattern that works correctly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}