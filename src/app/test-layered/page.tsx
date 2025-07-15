'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading Layered Timeline...</div>
});

// Test data representing life timeline
const testData = {
  nodes: [
    { id: '2018-education', name: 'University Start', fx: -600, fy: 0, fz: 0, color: '#DC2626', year: 2018 },
    { id: '2019-skill', name: 'Programming', fx: -400, fy: 50, fz: 0, color: '#2563EB', year: 2019 },
    { id: '2020-job', name: 'First Job', fx: -200, fy: -50, fz: 0, color: '#059669', year: 2020 },
    { id: '2021-project', name: 'Major Project', fx: 0, fy: 100, fz: 0, color: '#7C3AED', year: 2021 },
    { id: '2022-growth', name: 'Career Growth', fx: 200, fy: -30, fz: 0, color: '#059669', year: 2022 },
    { id: '2023-expertise', name: 'AI Expertise', fx: 400, fy: 80, fz: 0, color: '#2563EB', year: 2023 },
    { id: '2024-current', name: 'Current Role', fx: 600, fy: 0, fz: 0, color: '#F59E0B', year: 2024 }
  ],
  links: [
    { source: '2018-education', target: '2019-skill' },
    { source: '2019-skill', target: '2020-job' },
    { source: '2020-job', target: '2021-project' },
    { source: '2021-project', target: '2022-growth' },
    { source: '2022-growth', target: '2023-expertise' },
    { source: '2023-expertise', target: '2024-current' }
  ]
};

export default function LayeredTimeline() {
  const graphRef = useRef<any>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (graphRef.current) {
      setTimeout(() => {
        graphRef.current.cameraPosition({ x: 0, y: 200, z: 800 }, { x: 0, y: 0, z: 0 });
      }, 1000);
    }
  }, []);

  // Draw background visualization on HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawBackground = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, 'rgba(79, 70, 229, 0.1)');    // Deep blue start
      gradient.addColorStop(0.2, 'rgba(59, 130, 246, 0.1)'); // Blue
      gradient.addColorStop(0.4, 'rgba(16, 185, 129, 0.1)'); // Green
      gradient.addColorStop(0.6, 'rgba(245, 158, 11, 0.1)'); // Yellow
      gradient.addColorStop(0.8, 'rgba(239, 68, 68, 0.1)');  // Red
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0.1)');   // Purple end
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw time progression curve (inspired by your life timeline image)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      
      // Create curved timeline path
      const centerY = height / 2;
      const amplitude = 100;
      
      ctx.moveTo(50, centerY);
      for (let x = 50; x < width - 50; x += 5) {
        const progress = (x - 50) / (width - 100);
        const wave = Math.sin(progress * Math.PI * 2) * amplitude * (1 - progress * 0.5);
        const y = centerY + wave;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      
      // Draw year markers
      const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
      years.forEach((year, index) => {
        const x = 100 + (index * (width - 200) / (years.length - 1));
        const progress = index / (years.length - 1);
        const wave = Math.sin(progress * Math.PI * 2) * amplitude * (1 - progress * 0.5);
        const y = centerY + wave;
        
        // Year circle
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
        
        // Year label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(year.toString(), x, y + 30);
      });
      
      // Draw flowing particles
      const time = Date.now() * 0.001;
      for (let i = 0; i < 20; i++) {
        const particleProgress = ((time * 0.1 + i * 0.1) % 1);
        const x = 50 + particleProgress * (width - 100);
        const wave = Math.sin(particleProgress * Math.PI * 2) * amplitude * (1 - particleProgress * 0.5);
        const y = centerY + wave;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 255, ${0.8 - particleProgress * 0.5})`;
        ctx.fill();
      }
    };

    // Animation loop
    const animate = () => {
      drawBackground();
      requestAnimationFrame(animate);
    };
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* HTML5 Canvas Background Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
      />
      
      {/* 3D Graph Layer */}
      <div className="absolute inset-0 z-10">
        <ForceGraph3D
          ref={graphRef}
          graphData={testData}
          nodeLabel={(node: any) => `${node.name} (${node.year})`}
          nodeColor="color"
          nodeVal={15}
          linkColor={() => 'rgba(255, 255, 255, 0.6)'}
          linkWidth={4}
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
        <h2 className="text-xl font-bold mb-2">Layered Timeline Visualization</h2>
        <div className="text-sm space-y-1">
          <div>🎨 HTML5 Canvas background layer</div>
          <div>📊 Transparent 3D graph overlay</div>
          <div>🌊 Animated curve with flowing particles</div>
          <div>📅 Year markers along timeline path</div>
        </div>
        <div className="mt-3 text-xs text-gray-300">
          <div>• Background: Curved timeline visualization</div>
          <div>• Foreground: Interactive 3D force graph</div>
          <div>• Two-layer approach for rich visualization</div>
        </div>
      </div>
    </div>
  );
}