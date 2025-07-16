'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Force Graph...</div>
});

// Simple test data
const testData = {
  nodes: [
    { id: '1', name: 'Node 1', color: '#ff0000' },
    { id: '2', name: 'Node 2', color: '#00ff00' },
    { id: '3', name: 'Node 3', color: '#0000ff' }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '2', target: '3' }
  ]
};

export default function DebugThree() {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [threeLoaded, setThreeLoaded] = useState(false);

  useEffect(() => {
    const logs: string[] = [];
    
    // Check if window exists
    if (typeof window !== 'undefined') {
      logs.push('✅ Window object available');
      
      // Check for Three.js in various locations
      if ((window as any).THREE) {
        logs.push('✅ window.THREE exists');
        setThreeLoaded(true);
      } else {
        logs.push('❌ window.THREE not found');
      }
      
      // Check if ForceGraph3D might expose Three.js
      setTimeout(() => {
        if ((window as any).THREE) {
          logs.push('✅ window.THREE available after timeout');
          setThreeLoaded(true);
        } else {
          logs.push('❌ window.THREE still not available after timeout');
        }
        setDebugInfo([...logs]);
      }, 2000);
    } else {
      logs.push('❌ Window object not available (SSR)');
    }
    
    setDebugInfo(logs);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 text-white">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Three.js Debug Test</h1>
        
        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Debug Information:</h2>
          {debugInfo.map((log, index) => (
            <div key={index} className="text-sm">{log}</div>
          ))}
        </div>

        <div className="mb-4 p-4 bg-gray-800 rounded">
          <h2 className="text-lg font-semibold mb-2">Force Graph Status:</h2>
          <p>Three.js loaded: {threeLoaded ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>

      <div className="h-96">
        <ForceGraph3D
          graphData={testData}
          nodeLabel="name"
          nodeColor="color"
          backgroundColor="#000033"
          onEngineStop={() => {
            console.log('ForceGraph3D engine stopped');
            // Check again after graph loads
            if ((window as any).THREE) {
              setDebugInfo(prev => [...prev, '✅ window.THREE available after ForceGraph3D loads']);
              setThreeLoaded(true);
            }
          }}
        />
      </div>
    </div>
  );
}