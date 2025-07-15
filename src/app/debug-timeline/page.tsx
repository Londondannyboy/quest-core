'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Debug Timeline...</div>
});

// Simple test data with explicit positioning
const debugData = {
  nodes: [
    {
      id: 'node1',
      name: 'Education 2018',
      type: 'education',
      color: '#ffaa00',
      fx: -800, // Fixed X position - far left
      fy: 0,
      fz: 0
    },
    {
      id: 'node2', 
      name: 'Skill 2020',
      type: 'skill',
      color: '#3b82f6',
      fx: 0, // Fixed X position - center
      fy: 0,
      fz: 0
    },
    {
      id: 'node3',
      name: 'Job 2022', 
      type: 'job',
      color: '#10b981',
      fx: 800, // Fixed X position - right
      fy: 0,
      fz: 0
    },
    {
      id: 'node4',
      name: 'Project 2024',
      type: 'project', 
      color: '#8b5cf6',
      fx: 1600, // Fixed X position - far right
      fy: 0,
      fz: 0
    }
  ],
  links: [
    { source: 'node1', target: 'node2' },
    { source: 'node2', target: 'node3' },
    { source: 'node3', target: 'node4' }
  ]
};

export default function DebugTimeline() {
  const graphRef = useRef<any>();

  useEffect(() => {
    if (graphRef.current) {
      // Set camera position for horizontal timeline view
      setTimeout(() => {
        graphRef.current.cameraPosition(
          { x: 400, y: 300, z: 800 }, // Camera position
          { x: 400, y: 0, z: 0 }      // Look at center of timeline
        );
      }, 1000);
    }
  }, []);

  const addTimelineAxis = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    const THREE = (window as any).THREE;
    if (!THREE) return;

    const scene = graphRef.current.scene();
    
    // Remove existing axis
    const existingAxis = scene.getObjectByName('debugAxis');
    if (existingAxis) scene.remove(existingAxis);
    
    const axisGroup = new THREE.Group();
    axisGroup.name = 'debugAxis';
    
    // Add horizontal timeline axis
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1000, -200, 0),
      new THREE.Vector3(2000, -200, 0)
    ]);
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const axisLine = new THREE.Line(axisGeometry, axisMaterial);
    axisGroup.add(axisLine);
    
    // Add year markers
    [-800, 0, 800, 1600].forEach((x, i) => {
      const year = 2018 + (i * 2);
      
      // Tick mark
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -200, 0),
        new THREE.Vector3(x, -250, 0)
      ]);
      const tickLine = new THREE.Line(tickGeometry, axisMaterial);
      axisGroup.add(tickLine);
      
      // Year label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 200;
        canvas.height = 100;
        context.font = 'bold 30px Arial';
        context.fillStyle = 'white';
        context.fillText(year.toString(), 20, 60);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, -300, 0);
        sprite.scale.set(100, 50, 1);
        axisGroup.add(sprite);
      }
    });
    
    scene.add(axisGroup);
  };

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Debug Timeline Test</h2>
        <div>Simple 4-node timeline test</div>
        <div>Fixed positions: -800, 0, 800, 1600</div>
        <div>Camera: (400, 300, 800) → (400, 0, 0)</div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={debugData}
        nodeLabel="name"
        nodeColor="color" 
        nodeVal={10}
        linkColor={() => '#ffffff'}
        linkWidth={3}
        backgroundColor="#000020"
        warmupTicks={0}
        cooldownTicks={0}
        cooldownTime={Infinity}
        enableNavigationControls={true}
        onEngineStop={() => {
          setTimeout(() => {
            addTimelineAxis();
          }, 500);
        }}
      />
    </div>
  );
}