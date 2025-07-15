'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Background Demo...</div>
});

// Simple test data
const testData = {
  nodes: [
    { id: '2018', name: 'Past', fx: -800, fy: 0, fz: 0, color: '#8B5CF6' },
    { id: '2020', name: 'Present', fx: 0, fy: 0, fz: 0, color: '#3B82F6' },
    { id: '2022', name: 'Near Future', fx: 400, fy: 0, fz: 0, color: '#10B981' },
    { id: '2024', name: 'Future', fx: 800, fy: 0, fz: 0, color: '#F59E0B' }
  ],
  links: [
    { source: '2018', target: '2020' },
    { source: '2020', target: '2022' },
    { source: '2022', target: '2024' }
  ]
};

export default function BackgroundDemo() {
  const graphRef = useRef<any>();

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: 200, z: 600 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  const addTimeBackground = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    const THREE = (window as any).THREE;
    if (!THREE) return;

    const scene = graphRef.current.scene();
    
    // Remove existing backgrounds
    const existingBg = scene.getObjectByName('timeBackground');
    if (existingBg) scene.remove(existingBg);
    
    const bgGroup = new THREE.Group();
    bgGroup.name = 'timeBackground';
    
    // 1. GRADIENT BACKGROUND PLANE
    const bgGeometry = new THREE.PlaneGeometry(3000, 1000);
    
    // Create gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    
    if (context) {
      // Time-based gradient: Purple (past) → Blue (present) → Green (future) → Gold (far future)
      const gradient = context.createLinearGradient(0, 0, 512, 0);
      gradient.addColorStop(0, '#4C1D95');    // Deep purple (past)
      gradient.addColorStop(0.33, '#1E3A8A');  // Deep blue (past-present)
      gradient.addColorStop(0.5, '#0F172A');   // Dark center (present)
      gradient.addColorStop(0.66, '#064E3B');  // Deep green (present-future)
      gradient.addColorStop(1, '#92400E');     // Deep gold (future)
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 512, 128);
      
      const bgTexture = new THREE.CanvasTexture(canvas);
      const bgMaterial = new THREE.MeshBasicMaterial({ 
        map: bgTexture, 
        transparent: true, 
        opacity: 0.3 
      });
      
      const bgPlane = new THREE.Mesh(bgGeometry, bgMaterial);
      bgPlane.position.set(0, 0, -500);
      bgGroup.add(bgPlane);
    }
    
    // 2. FLOWING TIME PARTICLES
    const particleCount = 200;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Spread particles across timeline
      positions[i * 3] = (Math.random() - 0.5) * 2000;     // X: timeline spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;  // Y: vertical spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;  // Z: depth
      
      // Color based on X position (time)
      const timeProgress = (positions[i * 3] + 1000) / 2000; // 0 to 1
      if (timeProgress < 0.25) {
        // Past: Purple tones
        colors[i * 3] = 0.6 + Math.random() * 0.4;     // R
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.3; // G  
        colors[i * 3 + 2] = 0.8 + Math.random() * 0.2; // B
      } else if (timeProgress < 0.5) {
        // Present: Blue tones
        colors[i * 3] = 0.2 + Math.random() * 0.3;     // R
        colors[i * 3 + 1] = 0.5 + Math.random() * 0.3; // G
        colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
      } else if (timeProgress < 0.75) {
        // Near Future: Green tones
        colors[i * 3] = 0.1 + Math.random() * 0.2;     // R
        colors[i * 3 + 1] = 0.7 + Math.random() * 0.3; // G
        colors[i * 3 + 2] = 0.4 + Math.random() * 0.3; // B
      } else {
        // Future: Gold tones
        colors[i * 3] = 0.9 + Math.random() * 0.1;     // R
        colors[i * 3 + 1] = 0.8 + Math.random() * 0.2; // G
        colors[i * 3 + 2] = 0.2 + Math.random() * 0.3; // B
      }
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    bgGroup.add(particleSystem);
    
    // 3. TIME ZONE INDICATORS
    const timeZones = [
      { x: -600, color: 0x8B5CF6, label: 'PAST', opacity: 0.1 },
      { x: -200, color: 0x3B82F6, label: 'RECENT', opacity: 0.15 },
      { x: 200, color: 0x10B981, label: 'PRESENT', opacity: 0.2 },
      { x: 600, color: 0xF59E0B, label: 'FUTURE', opacity: 0.15 }
    ];
    
    timeZones.forEach(zone => {
      // Colored zone plane
      const zoneGeometry = new THREE.PlaneGeometry(300, 800);
      const zoneMaterial = new THREE.MeshBasicMaterial({
        color: zone.color,
        transparent: true,
        opacity: zone.opacity,
        side: THREE.DoubleSide
      });
      const zonePlane = new THREE.Mesh(zoneGeometry, zoneMaterial);
      zonePlane.position.set(zone.x, 0, -400);
      bgGroup.add(zonePlane);
      
      // Zone label
      const labelCanvas = document.createElement('canvas');
      const labelContext = labelCanvas.getContext('2d');
      if (labelContext) {
        labelCanvas.width = 256;
        labelCanvas.height = 64;
        labelContext.font = 'bold 24px Arial';
        labelContext.fillStyle = '#ffffff';
        labelContext.strokeStyle = '#000000';
        labelContext.lineWidth = 2;
        labelContext.textAlign = 'center';
        
        labelContext.strokeText(zone.label, 128, 40);
        labelContext.fillText(zone.label, 128, 40);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelMaterial = new THREE.SpriteMaterial({ 
          map: labelTexture, 
          transparent: true, 
          opacity: 0.7 
        });
        const labelSprite = new THREE.Sprite(labelMaterial);
        labelSprite.position.set(zone.x, -350, 0);
        labelSprite.scale.set(120, 30, 1);
        bgGroup.add(labelSprite);
      }
    });
    
    // 4. ANIMATED TIME WAVES
    const waveGeometry = new THREE.PlaneGeometry(2000, 100, 32, 1);
    const waveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x4C1D95) },
        color2: { value: new THREE.Color(0xF59E0B) }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * 0.01 + time) * 10.0;
          pos.y += wave;
          vWave = wave;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          vec3 color = mix(color1, color2, vUv.x);
          float alpha = 0.3 + vWave * 0.02;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const wave = new THREE.Mesh(waveGeometry, waveMaterial);
    wave.position.set(0, -200, -300);
    wave.rotation.x = Math.PI / 6;
    bgGroup.add(wave);
    
    // Animation loop for waves
    const animateWaves = () => {
      if (waveMaterial.uniforms) {
        waveMaterial.uniforms.time.value += 0.05;
      }
      requestAnimationFrame(animateWaves);
    };
    animateWaves();
    
    scene.add(bgGroup);
  };

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded max-w-sm">
        <h2 className="text-xl font-bold mb-2">Animated Time Background</h2>
        <div className="text-sm space-y-1">
          <div>🟣 Purple: Past (deep time)</div>
          <div>🔵 Blue: Recent past</div>
          <div>🟢 Green: Present moment</div>
          <div>🟡 Gold: Future possibilities</div>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          <div>• Gradient background plane</div>
          <div>• Color-coded particle flow</div>
          <div>• Time zone indicators</div>
          <div>• Animated wave effects</div>
        </div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={testData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal={12}
        linkColor={() => '#ffffff'}
        linkWidth={4}
        backgroundColor="transparent"
        warmupTicks={0}
        cooldownTicks={0}
        cooldownTime={Infinity}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        enableNavigationControls={true}
        onEngineStop={() => {
          setTimeout(() => {
            addTimeBackground();
          }, 500);
        }}
      />
    </div>
  );
}