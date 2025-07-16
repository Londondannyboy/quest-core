'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Fixed Timeline...</div>
});

// Fixed positioned timeline data
const fixedData = {
  nodes: [
    // 2018 Column
    { id: 'edu1', name: 'Computer Science Degree', type: 'education', color: '#DC2626', fx: -600, fy: -100, fz: 0 },
    
    // 2019 Column  
    { id: 'skill1', name: 'Python', type: 'skill', color: '#2563EB', fx: -300, fy: -150, fz: 0 },
    { id: 'skill2', name: 'SQL', type: 'skill', color: '#2563EB', fx: -300, fy: 0, fz: 0 },
    
    // 2020 Column
    { id: 'job1', name: 'Junior Developer', type: 'job', color: '#059669', fx: 0, fy: -100, fz: 0 },
    { id: 'skill3', name: 'React', type: 'skill', color: '#2563EB', fx: 0, fy: 100, fz: 0 },
    
    // 2021 Column
    { id: 'project1', name: 'First App', type: 'project', color: '#7C3AED', fx: 300, fy: -150, fz: 0 },
    { id: 'skill4', name: 'AWS', type: 'skill', color: '#2563EB', fx: 300, fy: 50, fz: 0 },
    
    // 2022 Column
    { id: 'job2', name: 'Senior Developer', type: 'job', color: '#059669', fx: 600, fy: -100, fz: 0 },
    
    // 2023 Column
    { id: 'skill5', name: 'AI/ML', type: 'skill', color: '#2563EB', fx: 900, fy: 0, fz: 0 },
    { id: 'project2', name: 'AI Platform', type: 'project', color: '#7C3AED', fx: 900, fy: -200, fz: 0 },
    
    // 2024 Column
    { id: 'job3', name: 'Tech Lead', type: 'job', color: '#059669', fx: 1200, fy: -50, fz: 0 },
    { id: 'project3', name: 'Quest Core', type: 'project', color: '#7C3AED', fx: 1200, fy: 100, fz: 0 }
  ],
  links: [
    { source: 'edu1', target: 'skill1' },
    { source: 'skill1', target: 'job1' },
    { source: 'job1', target: 'skill3' },
    { source: 'skill3', target: 'project1' },
    { source: 'project1', target: 'job2' },
    { source: 'job2', target: 'skill5' },
    { source: 'skill5', target: 'project2' },
    { source: 'project2', target: 'job3' },
    { source: 'job3', target: 'project3' }
  ]
};

export default function FixedTimeline() {
  const graphRef = useRef<any>();

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 300, y: 200, z: 800 }, { x: 300, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  const addYearLabels = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    if (!THREE) return;

    const scene = graphRef.current.scene();
    const labelGroup = new THREE.Group();
    labelGroup.name = 'yearLabels';
    
    // Add year labels
    [2018, 2019, 2020, 2021, 2022, 2023, 2024].forEach((year, i) => {
      const x = -600 + (i * 300);
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 200;
        canvas.height = 100;
        context.font = 'bold 40px Arial';
        context.fillStyle = '#ffffff';
        context.fillText(year.toString(), 10, 60);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, -300, 0);
        sprite.scale.set(120, 60, 1);
        labelGroup.add(sprite);
      }
      
      // Add vertical separator
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x + 150, -250, 0),
        new THREE.Vector3(x + 150, 250, 0)
      ]);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, opacity: 0.5, transparent: true });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      labelGroup.add(line);
    });
    
    scene.add(labelGroup);
  };

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Fixed Timeline Layout</h2>
        <div>Strict year-based columns</div>
        <div>Fixed node positions</div>
        <div>Clear temporal progression</div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={fixedData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal={8}
        linkColor={() => '#888888'}
        linkWidth={3}
        backgroundColor="#000033"
        warmupTicks={0}
        cooldownTicks={0}
        cooldownTime={Infinity}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        enableNavigationControls={true}
        onEngineStop={() => {
          setTimeout(() => {
            addYearLabels();
          }, 500);
        }}
      />
    </div>
  );
}