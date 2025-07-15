'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Circular Timeline...</div>
});

// Circular timeline - years as rings, types as layers
const generateCircularData = () => {
  const radius = 300;
  const centerY = 0;
  
  const nodes: any[] = [];
  const links: any[] = [];
  
  // Years as concentric circles
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
  
  years.forEach((year, yearIndex) => {
    const yearRadius = 100 + (yearIndex * 60);
    const itemsInYear = 3 + yearIndex; // More items in recent years
    
    for (let i = 0; i < itemsInYear; i++) {
      const angle = (i / itemsInYear) * Math.PI * 2;
      const types = ['education', 'skill', 'job', 'project'];
      const type = types[i % types.length];
      const colors = { education: '#DC2626', skill: '#2563EB', job: '#059669', project: '#7C3AED' };
      
      // Layer by type
      const layerZ = { education: -100, skill: -50, job: 0, project: 50 }[type] || 0;
      
      const node = {
        id: `${year}-${type}-${i}`,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${year}`,
        type,
        color: colors[type as keyof typeof colors],
        fx: Math.cos(angle) * yearRadius,
        fy: centerY + Math.sin(angle) * yearRadius,
        fz: layerZ,
        year,
        angle
      };
      
      nodes.push(node);
      
      // Link to next chronological item
      if (yearIndex > 0 && i < nodes.length - itemsInYear) {
        const prevYearNodes = nodes.filter(n => n.year === years[yearIndex - 1]);
        if (prevYearNodes.length > i) {
          links.push({
            source: prevYearNodes[i].id,
            target: node.id
          });
        }
      }
    }
  });
  
  return { nodes, links };
};

export default function CircularTimeline() {
  const graphRef = useRef<any>();
  const circularData = generateCircularData();

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: -200, z: 600 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  const addCircularEffects = () => {
    if (!graphRef.current || typeof window === 'undefined') return;
    
    const THREE = (window as any).THREE;
    if (!THREE) return;

    const scene = graphRef.current.scene();
    const effectGroup = new THREE.Group();
    effectGroup.name = 'circularEffects';
    
    // Add year rings
    [2018, 2019, 2020, 2021, 2022, 2023, 2024].forEach((year, i) => {
      const radius = 100 + (i * 60);
      const ringGeometry = new THREE.RingGeometry(radius - 2, radius + 2, 64);
      const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: year === 2024 ? 0x4fc3f7 : 0x333333,
        transparent: true,
        opacity: year === 2024 ? 0.6 : 0.2,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      effectGroup.add(ring);
      
      // Year label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 200;
        canvas.height = 100;
        context.font = 'bold 30px Arial';
        context.fillStyle = year === 2024 ? '#4fc3f7' : '#ffffff';
        context.fillText(year.toString(), 50, 60);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(radius + 50, 0, 0);
        sprite.scale.set(80, 40, 1);
        effectGroup.add(sprite);
      }
    });
    
    // Add type layer indicators
    const layers = [
      { name: 'Education', z: -100, color: '#DC2626' },
      { name: 'Skills', z: -50, color: '#2563EB' },
      { name: 'Jobs', z: 0, color: '#059669' },
      { name: 'Projects', z: 50, color: '#7C3AED' }
    ];
    
    layers.forEach(layer => {
      const planeGeometry = new THREE.PlaneGeometry(800, 800);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: 0.05,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.z = layer.z;
      effectGroup.add(plane);
    });
    
    scene.add(effectGroup);
  };

  return (
    <div className="w-full h-screen bg-black">
      <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Circular Timeline</h2>
        <div>Years as concentric rings</div>
        <div>Types as vertical layers</div>
        <div>Radial progression outward</div>
        <div className="mt-2 text-sm">
          <div>🔴 Education (-100)</div>
          <div>🔵 Skills (-50)</div>
          <div>🟢 Jobs (0)</div>
          <div>🟣 Projects (+50)</div>
        </div>
      </div>
      
      <ForceGraph3D
        ref={graphRef}
        graphData={circularData}
        nodeLabel={(node: any) => `${node.name} (${node.year})`}
        nodeColor="color"
        nodeVal={6}
        linkColor={() => '#555555'}
        linkWidth={2}
        backgroundColor="#000011"
        warmupTicks={0}
        cooldownTicks={0}
        cooldownTime={Infinity}
        d3AlphaDecay={1}
        d3VelocityDecay={1}
        enableNavigationControls={true}
        onEngineStop={() => {
          setTimeout(() => {
            addCircularEffects();
          }, 500);
        }}
      />
    </div>
  );
}