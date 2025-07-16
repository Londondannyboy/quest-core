'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

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

export default function MorphingTimelineFixed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.1);
    containerRef.current.appendChild(renderer.domElement);
    
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create simple morphing sphere
    const geometry = new THREE.SphereGeometry(200, 32, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.3,
      wireframe: false
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(0, 0, -500);
    scene.add(sphere);

    // Camera positioning
    camera.position.set(0, 200, 800);
    camera.lookAt(0, 0, 0);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;
      
      // Simple morphing effect
      sphere.rotation.x = time * 0.5;
      sphere.rotation.y = time * 0.3;
      sphere.scale.x = 1 + Math.sin(time) * 0.2;
      sphere.scale.y = 1 + Math.sin(time * 1.5) * 0.2;
      sphere.scale.z = 1 + Math.sin(time * 2) * 0.2;
      
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
        />
      </div>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-black/80 text-white p-4 rounded max-w-sm">
        <h2 className="text-xl font-bold mb-2">Fixed Morphing Background</h2>
        <div className="text-sm space-y-1">
          <div>✅ Proper Three.js import</div>
          <div>✅ Simple morphing sphere</div>
          <div>✅ Transparent graph overlay</div>
          <div>✅ Should work now!</div>
        </div>
      </div>
    </div>
  );
}