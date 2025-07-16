'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
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

export default function TrinityHeadPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const headRef = useRef<any>(null);
  const trinityRef = useRef<any>(null);
  const animationRef = useRef<number>();
  
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

  useEffect(() => {
    if (!containerRef.current) return;

    const initThreeJS = async () => {
      // Dynamically import Three.js
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = null; // Make background transparent
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        containerRef.current!.clientWidth / containerRef.current!.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 8);

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(containerRef.current!.clientWidth, containerRef.current!.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0); // Transparent background
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = rotationSpeed[0];

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      // Point lights for trinity elements
      const mindLight = new THREE.PointLight(0x4F46E5, 2, 10);
      mindLight.position.set(0, 1, 0);
      scene.add(mindLight);

      const bodyLight = new THREE.PointLight(0xDC2626, 2, 10);
      bodyLight.position.set(-1, -0.5, 0);
      scene.add(bodyLight);

      const spiritLight = new THREE.PointLight(0x059669, 2, 10);
      spiritLight.position.set(1, -0.5, 0);
      scene.add(spiritLight);

      // Create human head geometry (simplified)
      const headGeometry = new THREE.SphereGeometry(1.5, 32, 32);
      
      // Modify geometry to be more head-like
      const headVertices = headGeometry.attributes.position;
      for (let i = 0; i < headVertices.count; i++) {
        const x = headVertices.getX(i);
        const y = headVertices.getY(i);
        const z = headVertices.getZ(i);
        
        // Flatten the back of the head
        if (z < -0.5) {
          headVertices.setZ(i, z * 0.7);
        }
        
        // Elongate slightly for chin
        if (y < -0.5) {
          headVertices.setY(i, y * 1.1);
        }
      }
      headGeometry.attributes.position.needsUpdate = true;

      // Head material
      const headMaterial = new THREE.MeshPhongMaterial({
        color: 0x8B7355,
        transparent: true,
        opacity: 0.8, // Make more visible initially
        wireframe: false,
        shininess: 10
      });

      const headMesh = new THREE.Mesh(headGeometry, headMaterial);
      headMesh.castShadow = true;
      headMesh.receiveShadow = true;
      scene.add(headMesh);
      headRef.current = headMesh;

      // Trinity elements inside the head
      const trinityGroup = new THREE.Group();
      trinityRef.current = trinityGroup;

      // Mind (top) - Brain-like structure
      const mindGeometry = new THREE.IcosahedronGeometry(0.4, 2);
      const mindMaterial = new THREE.MeshPhongMaterial({
        color: 0x4F46E5,
        transparent: true,
        opacity: 0.9,
        emissive: 0x4F46E5,
        emissiveIntensity: 0.3
      });
      const mindMesh = new THREE.Mesh(mindGeometry, mindMaterial);
      mindMesh.position.set(0, 0.6, 0);
      trinityGroup.add(mindMesh);

      // Body (bottom left) - Geometric heart shape
      const bodyGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xDC2626,
        transparent: true,
        opacity: 0.9,
        emissive: 0xDC2626,
        emissiveIntensity: 0.3
      });
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.position.set(-0.5, -0.3, 0);
      trinityGroup.add(bodyMesh);

      // Spirit (bottom right) - Crystalline structure
      const spiritGeometry = new THREE.ConeGeometry(0.25, 0.6, 8);
      const spiritMaterial = new THREE.MeshPhongMaterial({
        color: 0x059669,
        transparent: true,
        opacity: 0.9,
        emissive: 0x059669,
        emissiveIntensity: 0.3
      });
      const spiritMesh = new THREE.Mesh(spiritGeometry, spiritMaterial);
      spiritMesh.position.set(0.5, -0.3, 0);
      trinityGroup.add(spiritMesh);

      // Add connecting lines between trinity elements
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
      });

      // Mind to Body line
      const mindToBodyGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0.6, 0),
        new THREE.Vector3(-0.5, -0.3, 0)
      ]);
      const mindToBodyLine = new THREE.Line(mindToBodyGeometry, lineMaterial);
      trinityGroup.add(mindToBodyLine);

      // Body to Spirit line
      const bodyToSpiritGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, -0.3, 0),
        new THREE.Vector3(0.5, -0.3, 0)
      ]);
      const bodyToSpiritLine = new THREE.Line(bodyToSpiritGeometry, lineMaterial);
      trinityGroup.add(bodyToSpiritLine);

      // Spirit to Mind line
      const spiritToMindGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.5, -0.3, 0),
        new THREE.Vector3(0, 0.6, 0)
      ]);
      const spiritToMindLine = new THREE.Line(spiritToMindGeometry, lineMaterial);
      trinityGroup.add(spiritToMindLine);

      scene.add(trinityGroup);

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        
        // Update controls
        controls.update();
        controls.autoRotateSpeed = rotationSpeed[0];
        
        // Update head opacity
        if (headRef.current) {
          headRef.current.material.opacity = headOpacity[0];
        }
        
        // Animate trinity elements
        const time = Date.now() * 0.001;
        
        if (trinityRef.current) {
          // Mind pulsing
          const mindMesh = trinityRef.current.children[0];
          if (mindMesh && trinityState.mind.active) {
            mindMesh.scale.setScalar(1 + Math.sin(time * 2) * 0.1 * trinityIntensity[0]);
            mindMesh.material.emissiveIntensity = 0.2 + Math.sin(time * 2) * 0.1 * trinityIntensity[0];
          }
          
          // Body heartbeat
          const bodyMesh = trinityRef.current.children[1];
          if (bodyMesh && trinityState.body.active) {
            bodyMesh.scale.setScalar(1 + Math.sin(time * 3) * 0.15 * trinityIntensity[0]);
            bodyMesh.material.emissiveIntensity = 0.2 + Math.sin(time * 3) * 0.1 * trinityIntensity[0];
          }
          
          // Spirit rotation
          const spiritMesh = trinityRef.current.children[2];
          if (spiritMesh && trinityState.spirit.active) {
            spiritMesh.rotation.y = time * 2 * trinityIntensity[0];
            spiritMesh.material.emissiveIntensity = 0.2 + Math.sin(time * 1.5) * 0.1 * trinityIntensity[0];
          }
        }
        
        renderer.render(scene, camera);
      };
      
      animate();

      // Handle window resize
      const handleResize = () => {
        if (!containerRef.current) return;
        
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    };

    initThreeJS();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update animation when controls change
  useEffect(() => {
    if (isPlaying && !animationRef.current) {
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);
        if (rendererRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, rendererRef.current.camera);
        }
      };
      animate();
    } else if (!isPlaying && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const resetView = () => {
    setRotationSpeed([0.5]);
    setTrinityIntensity([1.0]);
    setHeadOpacity([0.3]);
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
          Trinity Head Visualization
        </h1>
        <p className="text-gray-600 mt-2">
          Explore the trinity of mind, body, and spirit within the human form
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
              <div 
                ref={containerRef}
                className="w-full h-[600px] bg-gray-900 rounded-lg relative"
              />
              
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
                  The interconnected elements pulse and move in harmony, representing the integrated nature of human experience.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}