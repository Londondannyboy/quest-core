'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Morphing Timeline...</div>
});

// Test data for overlay graph
const testData = {
  nodes: [
    { id: '2018', name: 'University', fx: -400, fy: 0, fz: 0, color: '#DC2626' },
    { id: '2020', name: 'First Job', fx: -200, fy: 50, fz: 0, color: '#059669' },
    { id: '2022', name: 'Senior Role', fx: 0, fy: -30, fz: 0, color: '#059669' },
    { id: '2023', name: 'AI Expertise', fx: 200, fy: 80, fz: 0, color: '#2563EB' },
    { id: '2024', name: 'Current', fx: 400, fy: 0, fz: 0, color: '#F59E0B' }
  ],
  links: [
    { source: '2018', target: '2020' },
    { source: '2020', target: '2022' },
    { source: '2022', target: '2023' },
    { source: '2023', target: '2024' }
  ]
};

export default function MorphingTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const sceneRef = useRef<any>();
  const rendererRef = useRef<any>();
  const cameraRef = useRef<any>();
  const morphTargetsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const THREE = (window as any).THREE;
    if (!THREE) {
      console.log('THREE.js not available, retrying...');
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.1); // Semi-transparent background
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    containerRef.current.appendChild(renderer.domElement);
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Lighting setup (inspired by webgl_camera example)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create morphing geometry (similar to webgl_camera example)
    const createMorphGeometry = () => {
      const geometry = new THREE.SphereGeometry(200, 32, 16);
      
      // Create morph targets
      const position = geometry.attributes.position;
      const vector = new THREE.Vector3();
      
      // Target 1: Spiky sphere
      const spiky = [];
      for (let i = 0; i < position.count; i++) {
        vector.fromBufferAttribute(position, i);
        vector.normalize().multiplyScalar(200 + Math.random() * 100);
        spiky.push(vector.x, vector.y, vector.z);
      }
      geometry.morphAttributes.position = [];
      geometry.morphAttributes.position[0] = new THREE.Float32BufferAttribute(spiky, 3);
      
      // Target 2: Wavy deformation
      const wavy = [];
      for (let i = 0; i < position.count; i++) {
        vector.fromBufferAttribute(position, i);
        const wave = Math.sin(vector.x * 0.01) * Math.cos(vector.z * 0.01) * 50;
        vector.normalize().multiplyScalar(200 + wave);
        wavy.push(vector.x, vector.y, vector.z);
      }
      geometry.morphAttributes.position[1] = new THREE.Float32BufferAttribute(wavy, 3);
      
      // Target 3: Cubic distortion
      const cubic = [];
      for (let i = 0; i < position.count; i++) {
        vector.fromBufferAttribute(position, i);
        const distortion = (Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z)) * 0.3;
        vector.normalize().multiplyScalar(200 + distortion);
        cubic.push(vector.x, vector.y, vector.z);
      }
      geometry.morphAttributes.position[2] = new THREE.Float32BufferAttribute(cubic, 3);
      
      return geometry;
    };

    // Create multiple morphing objects
    const morphGeometry = createMorphGeometry();
    
    // Temporal-themed gradient material
    const morphMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        morphInfluence1: { value: 0 },
        morphInfluence2: { value: 0 },
        morphInfluence3: { value: 0 },
        colorStart: { value: new THREE.Color(0x4c1d95) }, // Deep purple
        colorEnd: { value: new THREE.Color(0xf59e0b) }     // Gold
      },
      vertexShader: `
        uniform float time;
        uniform float morphInfluence1;
        uniform float morphInfluence2;
        uniform float morphInfluence3;
        
        attribute vec3 morphTarget0;
        attribute vec3 morphTarget1;
        attribute vec3 morphTarget2;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vec3 transformed = position;
          transformed += morphTarget0 * morphInfluence1;
          transformed += morphTarget1 * morphInfluence2;
          transformed += morphTarget2 * morphInfluence3;
          
          // Add temporal wave
          float wave = sin(transformed.x * 0.01 + time) * 10.0;
          transformed.y += wave;
          
          vPosition = transformed;
          vNormal = normalize(normalMatrix * normal);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 colorStart;
        uniform vec3 colorEnd;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Time-based gradient
          float gradient = (vPosition.x + 300.0) / 600.0;
          vec3 color = mix(colorStart, colorEnd, gradient);
          
          // Lighting
          float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0)));
          light = max(light, 0.2);
          
          // Temporal pulse
          float pulse = sin(time * 2.0) * 0.2 + 0.8;
          
          gl_FragColor = vec4(color * light * pulse, 0.3);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    // Create multiple morphing spheres
    const morphObjects: any[] = [];
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(morphGeometry.clone(), morphMaterial.clone());
      mesh.position.set(
        (i - 1) * 400,
        Math.sin(i) * 200,
        -500 - i * 200
      );
      mesh.scale.set(0.8, 0.8, 0.8);
      morphObjects.push(mesh);
      scene.add(mesh);
    }
    
    morphTargetsRef.current = morphObjects;

    // Camera positioning
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // Update morph targets with smooth transitions
      morphObjects.forEach((mesh, index) => {
        const material = mesh.material as THREE.ShaderMaterial;
        material.uniforms.time.value = time;
        
        // Cycle through morph targets
        const cycle = time + index * 2;
        material.uniforms.morphInfluence1.value = Math.sin(cycle) * 0.5 + 0.5;
        material.uniforms.morphInfluence2.value = Math.sin(cycle * 0.7) * 0.5 + 0.5;
        material.uniforms.morphInfluence3.value = Math.sin(cycle * 1.3) * 0.5 + 0.5;
        
        // Rotate objects
        mesh.rotation.x = time * 0.5;
        mesh.rotation.y = time * 0.3;
        
        // Floating motion
        mesh.position.y = Math.sin(time + index) * 100;
      });
      
      // Dynamic camera movement
      camera.position.x = Math.cos(time * 0.1) * 100;
      camera.position.y = Math.sin(time * 0.15) * 50 + 200;
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      const container = containerRef.current;
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: 300, z: 600 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Three.js Background Layer */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 70%, #000000 100%)' }}
      />
      
      {/* 3D Graph Overlay Layer */}
      <div className="absolute inset-0 z-10">
        <ForceGraph3D
          ref={graphRef}
          graphData={testData}
          nodeLabel={(node: any) => `${node.name} (${node.id})`}
          nodeColor="color"
          nodeVal={20}
          linkColor={() => 'rgba(255, 255, 255, 0.8)'}
          linkWidth={5}
          backgroundColor="transparent"
          warmupTicks={0}
          cooldownTicks={0}
          cooldownTime={Infinity}
          d3AlphaDecay={1}
          d3VelocityDecay={1}
          enableNavigationControls={true}
          controlType="orbit"
        />
      </div>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-black/80 text-white p-4 rounded max-w-sm">
        <h2 className="text-xl font-bold mb-2">Morphing Geometry Background</h2>
        <div className="text-sm space-y-1">
          <div>🌊 Dynamic morphing spheres (fixed)</div>
          <div>✨ Temporal gradient shaders</div>
          <div>🎥 Animated camera movements</div>
          <div>📊 Transparent graph overlay</div>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          <div>• Background: Three.js morphing geometry</div>
          <div>• Foreground: Interactive temporal graph</div>
          <div>• Inspired by Three.js webgl_camera example</div>
        </div>
      </div>
    </div>
  );
}