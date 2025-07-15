'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Force Timeline...</div>
});

// Rich test data with natural force layout
const forceData = {
  nodes: [
    // Education
    { id: 'harvard', name: 'Harvard University', type: 'education', color: '#DC2626', size: 8, year: 2018 },
    { id: 'mit', name: 'MIT Course', type: 'education', color: '#DC2626', size: 6, year: 2019 },
    
    // Skills
    { id: 'js', name: 'JavaScript', type: 'skill', color: '#2563EB', size: 7, year: 2019 },
    { id: 'react', name: 'React', type: 'skill', color: '#2563EB', size: 8, year: 2020 },
    { id: 'node', name: 'Node.js', type: 'skill', color: '#2563EB', size: 7, year: 2020 },
    { id: 'ai', name: 'AI/ML', type: 'skill', color: '#2563EB', size: 9, year: 2023 },
    
    // Jobs
    { id: 'startup', name: 'Startup Developer', type: 'job', color: '#059669', size: 8, year: 2020 },
    { id: 'faang', name: 'FAANG Engineer', type: 'job', color: '#059669', size: 10, year: 2022 },
    { id: 'cto', name: 'CTO Role', type: 'job', color: '#059669', size: 9, year: 2024 },
    
    // Projects
    { id: 'webapp', name: 'E-commerce App', type: 'project', color: '#7C3AED', size: 6, year: 2021 },
    { id: 'saas', name: 'SaaS Platform', type: 'project', color: '#7C3AED', size: 8, year: 2022 },
    { id: 'ai-tool', name: 'AI Tool', type: 'project', color: '#7C3AED', size: 9, year: 2023 },
    { id: 'quest', name: 'Quest Core', type: 'project', color: '#7C3AED', size: 10, year: 2024 }
  ],
  links: [
    // Education to Skills
    { source: 'harvard', target: 'js', strength: 0.8 },
    { source: 'mit', target: 'ai', strength: 0.9 },
    
    // Skills progression
    { source: 'js', target: 'react', strength: 0.9 },
    { source: 'js', target: 'node', strength: 0.8 },
    { source: 'react', target: 'ai', strength: 0.6 },
    
    // Skills to Jobs
    { source: 'react', target: 'startup', strength: 0.9 },
    { source: 'node', target: 'startup', strength: 0.8 },
    { source: 'ai', target: 'faang', strength: 0.9 },
    { source: 'ai', target: 'cto', strength: 0.8 },
    
    // Job progression
    { source: 'startup', target: 'faang', strength: 0.8 },
    { source: 'faang', target: 'cto', strength: 0.7 },
    
    // Projects
    { source: 'startup', target: 'webapp', strength: 0.9 },
    { source: 'faang', target: 'saas', strength: 0.8 },
    { source: 'ai', target: 'ai-tool', strength: 0.9 },
    { source: 'cto', target: 'quest', strength: 1.0 }
  ]
};

export default function ForceTimeline() {
  const graphRef = useRef<any>();

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: 0, z: 300 });
      }, 2000);
    }
  }, []);

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Force-Based Timeline</h2>
        <div>Natural physics simulation</div>
        <div>13 nodes, organic clustering</div>
        <div>Color-coded by type</div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={forceData}
        nodeLabel={(node: any) => `${node.name} (${node.year})`}
        nodeColor="color"
        nodeVal="size"
        linkColor={() => '#666666'}
        linkWidth={2}
        backgroundColor="#001122"
        warmupTicks={100}
        cooldownTicks={200}
        enableNavigationControls={true}
      />
    </div>
  );
}