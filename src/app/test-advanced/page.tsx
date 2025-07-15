'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Advanced Timeline...</div>
});

// Rich timeline data
const timelineData = {
  nodes: [
    { id: 'education-2018', name: 'University Start', fx: -500, fy: 0, fz: 0, color: '#DC2626', type: 'education' },
    { id: 'skill-2019', name: 'Programming', fx: -300, fy: 100, fz: 50, color: '#2563EB', type: 'skill' },
    { id: 'job-2020', name: 'First Job', fx: -100, fy: -50, fz: -30, color: '#059669', type: 'job' },
    { id: 'project-2021', name: 'Major Project', fx: 100, fy: 150, fz: 80, color: '#7C3AED', type: 'project' },
    { id: 'growth-2022', name: 'Senior Role', fx: 300, fy: -20, fz: -50, color: '#059669', type: 'job' },
    { id: 'expertise-2023', name: 'AI Mastery', fx: 500, fy: 80, fz: 100, color: '#2563EB', type: 'skill' },
    { id: 'current-2024', name: 'Innovation', fx: 700, fy: 0, fz: 0, color: '#F59E0B', type: 'current' }
  ],
  links: [
    { source: 'education-2018', target: 'skill-2019' },
    { source: 'skill-2019', target: 'job-2020' },
    { source: 'job-2020', target: 'project-2021' },
    { source: 'project-2021', target: 'growth-2022' },
    { source: 'growth-2022', target: 'expertise-2023' },
    { source: 'expertise-2023', target: 'current-2024' }
  ]
};

export default function AdvancedTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>();
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const THREE = (window as any).THREE;
    if (!THREE) {
      setTimeout(() => window.location.reload(), 1000);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0.05);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    containerRef.current.appendChild(renderer.domElement);

    // Advanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);

    // Multiple colored lights for dynamic effect
    const lights = [
      { color: 0x4c1d95, position: [-800, 300, 200] },
      { color: 0x2563eb, position: [0, 400, 300] },
      { color: 0xf59e0b, position: [800, 200, -200] }
    ];

    lights.forEach(lightConfig => {
      const light = new THREE.PointLight(lightConfig.color, 0.8, 1000);
      light.position.set(...lightConfig.position);
      scene.add(light);
    });

    // Create flowing particle system
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Position particles along timeline path
      const timeProgress = Math.random();
      positions[i * 3] = (timeProgress - 0.5) * 2000;     // X: timeline
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800; // Y: spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600; // Z: depth
      
      // Velocities for flowing effect
      velocities[i * 3] = Math.random() * 2 - 1;
      velocities[i * 3 + 1] = Math.random() * 2 - 1;
      velocities[i * 3 + 2] = Math.random() * 2 - 1;
      
      // Color based on timeline position
      if (timeProgress < 0.2) {
        colors[i * 3] = 0.8; colors[i * 3 + 1] = 0.2; colors[i * 3 + 2] = 0.9; // Purple
      } else if (timeProgress < 0.4) {
        colors[i * 3] = 0.2; colors[i * 3 + 1] = 0.6; colors[i * 3 + 2] = 0.9; // Blue
      } else if (timeProgress < 0.6) {
        colors[i * 3] = 0.1; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 0.6; // Green
      } else if (timeProgress < 0.8) {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 0.2; // Gold
      } else {
        colors[i * 3] = 0.9; colors[i * 3 + 1] = 0.3; colors[i * 3 + 2] = 0.1; // Orange
      }
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Create temporal energy waves
    const waveGeometry = new THREE.PlaneGeometry(2000, 400, 64, 16);
    const waveMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        amplitude: { value: 50 }
      },
      vertexShader: `
        uniform float time;
        uniform float amplitude;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Multiple wave frequencies
          float wave1 = sin(pos.x * 0.01 + time) * amplitude;
          float wave2 = sin(pos.x * 0.005 + time * 1.5) * amplitude * 0.5;
          float wave3 = sin(pos.x * 0.02 + time * 0.5) * amplitude * 0.3;
          
          pos.z += wave1 + wave2 + wave3;
          vWave = (wave1 + wave2 + wave3) / amplitude;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying float vWave;
        
        void main() {
          // Time-based color cycling
          vec3 color1 = vec3(0.3, 0.1, 0.6);  // Purple
          vec3 color2 = vec3(0.1, 0.4, 0.8);  // Blue
          vec3 color3 = vec3(0.9, 0.6, 0.1);  // Gold
          
          float colorMix = sin(time + vUv.x * 3.14159) * 0.5 + 0.5;
          vec3 finalColor = mix(mix(color1, color2, colorMix), color3, vWave * 0.5 + 0.5);
          
          float alpha = 0.1 + abs(vWave) * 0.2;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const energyWave = new THREE.Mesh(waveGeometry, waveMaterial);
    energyWave.position.y = -200;
    energyWave.rotation.x = -Math.PI / 6;
    scene.add(energyWave);

    // Create floating geometric shapes
    const geometries = [
      new THREE.TetrahedronGeometry(20),
      new THREE.OctahedronGeometry(15),
      new THREE.IcosahedronGeometry(18)
    ];

    const floatingShapes = [];
    for (let i = 0; i < 20; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5),
        transparent: true,
        opacity: 0.4,
        shininess: 100
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 1500,
        (Math.random() - 0.5) * 600,
        (Math.random() - 0.5) * 800
      );
      
      mesh.userData = {
        originalY: mesh.position.y,
        speed: Math.random() * 0.02 + 0.01,
        rotationSpeed: Math.random() * 0.05 + 0.01
      };
      
      floatingShapes.push(mesh);
      scene.add(mesh);
    }

    // Camera setup
    camera.position.set(0, 300, 1000);
    camera.lookAt(0, 0, 0);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.016;

      // Update particle system
      const particlePositions = particleSystem.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] += velocities[i * 3] * 0.5;
        particlePositions[i * 3 + 1] += velocities[i * 3 + 1] * 0.3;
        particlePositions[i * 3 + 2] += velocities[i * 3 + 2] * 0.2;
        
        // Wrap particles around
        if (particlePositions[i * 3] > 1000) particlePositions[i * 3] = -1000;
        if (particlePositions[i * 3] < -1000) particlePositions[i * 3] = 1000;
      }
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // Update energy wave
      waveMaterial.uniforms.time.value = time;

      // Update floating shapes
      floatingShapes.forEach(shape => {
        shape.rotation.x += shape.userData.rotationSpeed;
        shape.rotation.y += shape.userData.rotationSpeed * 0.7;
        shape.position.y = shape.userData.originalY + Math.sin(time * shape.userData.speed) * 50;
      });

      // Dynamic camera movement
      camera.position.x = Math.cos(time * 0.05) * 200;
      camera.position.y = 300 + Math.sin(time * 0.03) * 100;
      camera.lookAt(0, 0, 0);

      // Animate lights
      lights.forEach((lightConfig, index) => {
        const light = scene.children.find(child => 
          child instanceof THREE.PointLight && 
          child.color.getHex() === lightConfig.color
        ) as THREE.PointLight;
        
        if (light) {
          light.intensity = 0.5 + Math.sin(time + index * 2) * 0.3;
          light.position.y = lightConfig.position[1] + Math.sin(time * 0.5 + index) * 100;
        }
      });

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 200, y: 400, z: 800 }, { x: 200, y: 0, z: 0 });
      }, 1500);
    }
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* Three.js Advanced Background */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 z-0"
        style={{ 
          background: 'radial-gradient(ellipse at center, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)' 
        }}
      />
      
      {/* Timeline Graph Overlay */}
      <div className="absolute inset-0 z-10">
        <ForceGraph3D
          ref={graphRef}
          graphData={timelineData}
          nodeLabel={(node: any) => `${node.name} (${node.type})`}
          nodeColor="color"
          nodeVal={25}
          linkColor={() => 'rgba(255, 255, 255, 0.9)'}
          linkWidth={6}
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
      
      {/* Enhanced UI */}
      <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg max-w-sm border border-white/20">
        <h2 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-gold-400">
          Advanced Temporal Experience
        </h2>
        <div className="text-sm space-y-1">
          <div>🌊 2000 flowing particles</div>
          <div>✨ Dynamic shader waves</div>
          <div>🔮 Floating geometric shapes</div>
          <div>💡 Multi-colored dynamic lighting</div>
          <div>🎥 Cinematic camera movements</div>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          <div>Revolutionary three-layer visualization:</div>
          <div>• Particle systems & energy waves</div>
          <div>• Floating geometric elements</div>
          <div>• Interactive temporal graph</div>
        </div>
      </div>
    </div>
  );
}