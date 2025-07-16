'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Spiral Timeline...</div>
});

// Spiral timeline - time flows in 3D spiral
const generateSpiralData = () => {
  const nodes: any[] = [];
  const links: any[] = [];
  
  // Create timeline events
  const events = [
    { year: 2018, month: 9, name: 'Started University', type: 'education' },
    { year: 2019, month: 1, name: 'First Programming Course', type: 'education' },
    { year: 2019, month: 6, name: 'Learned JavaScript', type: 'skill' },
    { year: 2019, month: 12, name: 'Web Development Intern', type: 'job' },
    { year: 2020, month: 3, name: 'React Mastery', type: 'skill' },
    { year: 2020, month: 8, name: 'First Full App', type: 'project' },
    { year: 2020, month: 11, name: 'Junior Developer', type: 'job' },
    { year: 2021, month: 2, name: 'Node.js Expert', type: 'skill' },
    { year: 2021, month: 7, name: 'E-commerce Platform', type: 'project' },
    { year: 2021, month: 12, name: 'Graduated CS Degree', type: 'education' },
    { year: 2022, month: 3, name: 'Senior Developer', type: 'job' },
    { year: 2022, month: 8, name: 'Cloud Architecture', type: 'skill' },
    { year: 2022, month: 11, name: 'SaaS Startup', type: 'project' },
    { year: 2023, month: 4, name: 'AI/ML Specialization', type: 'skill' },
    { year: 2023, month: 9, name: 'AI Platform Launch', type: 'project' },
    { year: 2024, month: 1, name: 'Technical Lead', type: 'job' },
    { year: 2024, month: 6, name: 'Quest Core', type: 'project' }
  ];
  
  const colors = { 
    education: '#DC2626', 
    skill: '#2563EB', 
    job: '#059669', 
    project: '#7C3AED' 
  };
  
  events.forEach((event, index) => {
    // Convert date to continuous time value
    const timeValue = (event.year - 2018) + (event.month / 12);
    
    // Spiral parameters
    const spiralRadius = 200;
    const spiralHeight = 100;
    const spiralTurns = 3;
    
    // Calculate spiral position
    const angle = (timeValue / 6) * spiralTurns * Math.PI * 2; // 6 years total
    const x = Math.cos(angle) * spiralRadius;
    const z = Math.sin(angle) * spiralRadius;
    const y = (timeValue / 6) * spiralHeight * 4 - 200; // Height progression
    
    const node = {
      id: `event-${index}`,
      name: event.name,
      type: event.type,
      color: colors[event.type as keyof typeof colors],
      fx: x,
      fy: y,
      fz: z,
      timeValue,
      year: event.year,
      month: event.month
    };
    
    nodes.push(node);
    
    // Link to previous event
    if (index > 0) {
      links.push({
        source: `event-${index - 1}`,
        target: `event-${index}`
      });
    }
  });
  
  return { nodes, links };
};

export default function SpiralTimeline() {
  const graphRef = useRef<any>();
  const spiralData = generateSpiralData();

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 400, y: 100, z: 400 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  const addSpiralEffects = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    if (!THREE) return;

    const scene = graphRef.current.scene();
    const effectGroup = new THREE.Group();
    effectGroup.name = 'spiralEffects';
    
    // Create spiral guide line
    const spiralPoints = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const timeValue = t * 6; // 6 years
      const angle = (timeValue / 6) * 3 * Math.PI * 2;
      const radius = 200;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = t * 400 - 200;
      spiralPoints.push(new THREE.Vector3(x, y, z));
    }
    
    const spiralGeometry = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4fc3f7, 
      opacity: 0.3, 
      transparent: true,
      linewidth: 3
    });
    const spiralLine = new THREE.Line(spiralGeometry, spiralMaterial);
    effectGroup.add(spiralLine);
    
    // Add year markers
    [2018, 2019, 2020, 2021, 2022, 2023, 2024].forEach(year => {
      const timeValue = year - 2018;
      const angle = (timeValue / 6) * 3 * Math.PI * 2;
      const radius = 250;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (timeValue / 6) * 400 - 200;
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 200;
        canvas.height = 100;
        context.font = 'bold 32px Arial';
        context.fillStyle = '#4fc3f7';
        context.fillText(year.toString(), 20, 60);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, y, z);
        sprite.scale.set(100, 50, 1);
        effectGroup.add(sprite);
      }
    });
    
    scene.add(effectGroup);
  };

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Spiral Timeline</h2>
        <div>Time flows in 3D spiral</div>
        <div>Continuous temporal progression</div>
        <div>Height = time, radius = spiral</div>
        <div className="mt-2 text-sm">
          <div>17 events from 2018-2024</div>
          <div>Connected chronologically</div>
        </div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={spiralData}
        nodeLabel={(node: any) => `${node.name} (${node.month}/${node.year})`}
        nodeColor="color"
        nodeVal={5}
        linkColor={() => '#888888'}
        linkWidth={3}
        backgroundColor="#000022"
        warmupTicks={0}
        cooldownTicks={0}
        cooldownTime={Infinity}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        enableNavigationControls={true}
        onEngineStop={() => {
          setTimeout(() => {
            addSpiralEffects();
          }, 500);
        }}
      />
    </div>
  );
}