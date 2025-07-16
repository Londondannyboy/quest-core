'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Curved Timeline...</div>
});

// Generate curved timeline data similar to your life timeline image
const generateCurvedData = () => {
  const nodes: any[] = [];
  const links: any[] = [];
  
  // Timeline events along a curved path
  const events = [
    { year: 2018, name: 'University', type: 'education', angle: 0 },
    { year: 2019, name: 'First Code', type: 'skill', angle: 30 },
    { year: 2019.5, name: 'Internship', type: 'job', angle: 60 },
    { year: 2020, name: 'React Mastery', type: 'skill', angle: 90 },
    { year: 2020.5, name: 'First Project', type: 'project', angle: 120 },
    { year: 2021, name: 'Junior Dev', type: 'job', angle: 150 },
    { year: 2021.5, name: 'Cloud Skills', type: 'skill', angle: 180 },
    { year: 2022, name: 'Senior Role', type: 'job', angle: 210 },
    { year: 2022.5, name: 'SaaS Platform', type: 'project', angle: 240 },
    { year: 2023, name: 'AI Expertise', type: 'skill', angle: 270 },
    { year: 2023.5, name: 'CTO Role', type: 'job', angle: 300 },
    { year: 2024, name: 'Quest Core', type: 'project', angle: 330 }
  ];
  
  const colors = {
    education: '#DC2626',
    skill: '#2563EB', 
    job: '#059669',
    project: '#7C3AED'
  };
  
  events.forEach((event, index) => {
    // Convert angle to radians and create curved position
    const angleRad = (event.angle * Math.PI) / 180;
    const radius = 300 + (index * 20); // Expanding spiral
    const x = Math.cos(angleRad) * radius;
    const z = Math.sin(angleRad) * radius;
    const y = (index - events.length / 2) * 30; // Vertical spread
    
    const node = {
      id: `event-${index}`,
      name: event.name,
      year: event.year,
      type: event.type,
      color: colors[event.type as keyof typeof colors],
      fx: x,
      fy: y,
      fz: z,
      angle: event.angle,
      radius
    };
    
    nodes.push(node);
    
    // Link to next event
    if (index > 0) {
      links.push({
        source: `event-${index - 1}`,
        target: `event-${index}`
      });
    }
  });
  
  return { nodes, links };
};

export default function CurvedTimeline() {
  const graphRef = useRef<any>();
  const curvedData = generateCurvedData();

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: 400, z: 600 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  const addCurvedEffects = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    if (!THREE) {
      setTimeout(addCurvedEffects, 1000);
      return;
    }

    const scene = graphRef.current.scene();
    const effectGroup = new THREE.Group();
    effectGroup.name = 'curvedEffects';
    
    // Draw curved timeline path
    const curvePoints = [];
    for (let i = 0; i <= 100; i++) {
      const progress = i / 100;
      const angle = progress * 330 * (Math.PI / 180); // 330 degrees total
      const radius = 300 + (progress * 240); // Expanding from 300 to 540
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (progress - 0.5) * 360; // Vertical progression
      curvePoints.push(new THREE.Vector3(x, y, z));
    }
    
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4fc3f7, 
      opacity: 0.6, 
      transparent: true,
      linewidth: 5
    });
    const curveLine = new THREE.Line(curveGeometry, curveMaterial);
    effectGroup.add(curveLine);
    
    // Add milestone markers along curve
    [2018, 2019, 2020, 2021, 2022, 2023, 2024].forEach((year, index) => {
      const progress = index / 6;
      const angle = progress * 330 * (Math.PI / 180);
      const radius = 300 + (progress * 240);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (progress - 0.5) * 360;
      
      // Year marker ring
      const ringGeometry = new THREE.RingGeometry(15, 20, 16);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: year === 2024 ? 0xff6b35 : 0x4fc3f7,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x, y, z);
      ring.lookAt(0, y, 0);
      effectGroup.add(ring);
      
      // Year label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 128;
        canvas.height = 64;
        context.font = 'bold 20px Arial';
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        context.textAlign = 'center';
        
        context.strokeText(year.toString(), 64, 40);
        context.fillText(year.toString(), 64, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
          map: texture, 
          transparent: true 
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x * 1.2, y + 40, z * 1.2);
        sprite.scale.set(60, 30, 1);
        effectGroup.add(sprite);
      }
    });
    
    // Add era zones (like geological periods in your image)
    const eras = [
      { start: 0, end: 0.3, color: 0x4c1d95, name: 'Foundation Era' },
      { start: 0.3, end: 0.6, color: 0x1e40af, name: 'Growth Era' },
      { start: 0.6, end: 0.9, color: 0x059669, name: 'Mastery Era' },
      { start: 0.9, end: 1.0, color: 0xdc2626, name: 'Innovation Era' }
    ];
    
    eras.forEach(era => {
      const startAngle = era.start * 330 * (Math.PI / 180);
      const endAngle = era.end * 330 * (Math.PI / 180);
      
      // Create arc geometry for era
      const arcPoints = [];
      for (let i = 0; i <= 20; i++) {
        const progress = i / 20;
        const angle = startAngle + (endAngle - startAngle) * progress;
        const radius = 280; // Inner radius for era bands
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (era.start + (era.end - era.start) * progress - 0.5) * 360;
        arcPoints.push(new THREE.Vector3(x, y, z));
      }
      
      const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMaterial = new THREE.LineBasicMaterial({
        color: era.color,
        opacity: 0.4,
        transparent: true,
        linewidth: 8
      });
      const arcLine = new THREE.Line(arcGeometry, arcMaterial);
      effectGroup.add(arcLine);
    });
    
    scene.add(effectGroup);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Curved Life Timeline</h2>
        <div className="text-sm space-y-1">
          <div>🌀 Expanding spiral timeline</div>
          <div>🎯 12 life events from 2018-2024</div>
          <div>🎨 Era-based color coding</div>
          <div>📊 Inspired by geological timelines</div>
        </div>
        <div className="mt-2 text-xs text-gray-300">
          <div>🟣 Foundation Era • 🔵 Growth Era</div>
          <div>🟢 Mastery Era • 🔴 Innovation Era</div>
        </div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={curvedData}
        nodeLabel={(node: any) => `${node.name} (${node.year})`}
        nodeColor="color"
        nodeVal={8}
        linkColor={() => '#ffffff'}
        linkWidth={3}
        backgroundColor="transparent"
        warmupTicks={0}
        cooldownTicks={0}
        cooldownTime={Infinity}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        enableNavigationControls={true}
        onEngineStop={() => {
          setTimeout(() => {
            addCurvedEffects();
          }, 500);
        }}
      />
    </div>
  );
}