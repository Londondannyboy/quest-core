'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Calendar, Clock, Users, Award, BookOpen, Briefcase } from 'lucide-react';

// Dynamic import to avoid SSR issues
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading 3D Timeline...</div>
});

interface TemporalNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number; z: number };
  temporalMetadata: {
    t_valid: Date;
    t_invalid?: Date;
    t_created: Date;
    duration?: number;
    isActive: boolean;
  };
  visualProperties: {
    color: string;
    size: number;
    opacity: number;
  };
}

interface TemporalLink {
  source: string;
  target: string;
  type: string;
  strength: number;
  temporalMetadata: {
    t_valid: Date;
    t_invalid?: Date;
    overlapDuration?: number;
  };
}

interface TemporalGraphData {
  nodes: TemporalNode[];
  links: TemporalLink[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

interface TimelineStats {
  totalNodes: number;
  totalLinks: number;
  timeSpan: number; // in years
  activeNodes: number;
  nodeTypes: Record<string, number>;
}

export function TemporalTimeline3D() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TemporalGraphData | null>(null);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<[number, number]>([2010, 2024]);
  const [hoveredNode, setHoveredNode] = useState<TemporalNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<TemporalNode | null>(null);
  const graphRef = useRef<any>();

  // Initialize user ID
  useEffect(() => {
    if (isSignedIn && user) {
      setUserId(user.id);
    }
  }, [isSignedIn, user]);

  // Fetch temporal timeline data
  const fetchTimelineData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: new Date(selectedTimeRange[0], 0, 1).toISOString(),
        endDate: new Date(selectedTimeRange[1], 11, 31).toISOString()
      });

      // Try authenticated endpoint first, fallback to debug endpoint
      let response = await fetch(`/api/temporal/timeline?${params}`);
      let result = await response.json();
      
      // If unauthorized or no userId, use debug endpoint
      if (!response.ok || !userId) {
        console.log('Using debug endpoint for temporal timeline');
        response = await fetch('/api/debug/temporal-timeline');
        result = await response.json();
      }

      if (result.success) {
        // Convert date strings back to Date objects
        const processedData = {
          ...result.data,
          nodes: result.data.nodes.map((node: any) => ({
            ...node,
            temporalMetadata: {
              ...node.temporalMetadata,
              t_valid: new Date(node.temporalMetadata.t_valid),
              t_invalid: node.temporalMetadata.t_invalid ? new Date(node.temporalMetadata.t_invalid) : undefined,
              t_created: new Date(node.temporalMetadata.t_created)
            }
          })),
          links: result.data.links.map((link: any) => ({
            ...link,
            temporalMetadata: {
              ...link.temporalMetadata,
              t_valid: new Date(link.temporalMetadata.t_valid),
              t_invalid: link.temporalMetadata.t_invalid ? new Date(link.temporalMetadata.t_invalid) : undefined
            }
          })),
          timeRange: {
            start: new Date(result.data.timeRange.start),
            end: new Date(result.data.timeRange.end)
          }
        };

        setTimelineData(processedData);
        setStats(calculateStats(processedData));
      } else {
        setError(result.error || 'Failed to fetch timeline data');
      }
    } catch (err) {
      console.error('Timeline fetch error:', err);
      // Provide fallback sample data for demonstration
      const sampleData: TemporalGraphData = {
        nodes: [
          {
            id: 'sample-skill-1',
            name: 'TypeScript',
            type: 'skill',
            position: { x: 50, y: 100, z: -200 },
            temporalMetadata: {
              t_valid: new Date('2020-01-01'),
              t_created: new Date('2020-01-01'),
              duration: 48,
              isActive: true
            },
            visualProperties: {
              color: '#3b82f6',
              size: 5,
              opacity: 0.8
            }
          },
          {
            id: 'sample-job-1',
            name: 'Software Engineer',
            type: 'job',
            position: { x: 75, y: 150, z: -100 },
            temporalMetadata: {
              t_valid: new Date('2022-01-01'),
              t_created: new Date('2022-01-01'),
              duration: 24,
              isActive: true
            },
            visualProperties: {
              color: '#10b981',
              size: 8,
              opacity: 0.9
            }
          }
        ],
        links: [
          {
            source: 'sample-skill-1',
            target: 'sample-job-1',
            type: 'skill_to_job',
            strength: 0.8,
            temporalMetadata: {
              t_valid: new Date('2022-01-01'),
              overlapDuration: 24
            }
          }
        ],
        timeRange: {
          start: new Date('2020-01-01'),
          end: new Date('2024-12-31')
        }
      };
      
      setTimelineData(sampleData);
      setStats(calculateStats(sampleData));
      setError('Using sample data - Connect your profile to see real timeline');
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedTimeRange]);

  // Calculate statistics
  const calculateStats = (data: TemporalGraphData): TimelineStats => {
    const nodeTypes: Record<string, number> = {};
    let activeNodes = 0;

    data.nodes.forEach(node => {
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
      if (node.temporalMetadata.isActive) activeNodes++;
    });

    const timeSpan = data.timeRange.end.getFullYear() - data.timeRange.start.getFullYear();

    return {
      totalNodes: data.nodes.length,
      totalLinks: data.links.length,
      timeSpan,
      activeNodes,
      nodeTypes
    };
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);
  
  // Fix node positions based on temporal data with linear arrangement
  useEffect(() => {
    if (timelineData && graphRef.current) {
      const graph = graphRef.current;
      
      // Sort nodes by date for linear arrangement
      const sortedNodes = [...timelineData.nodes].sort((a, b) => 
        new Date(a.temporalMetadata.t_valid).getTime() - new Date(b.temporalMetadata.t_valid).getTime()
      );
      
      // Group nodes by year for organized layout
      const nodesByYear = sortedNodes.reduce((acc, node) => {
        const year = new Date(node.temporalMetadata.t_valid).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(node);
        return acc;
      }, {} as Record<number, typeof sortedNodes>);
      
      // Position nodes in year frames from left to right (X-axis timeline)
      Object.entries(nodesByYear).forEach(([year, nodes]) => {
        const yearNum = parseInt(year);
        const x = (yearNum - 2020) * 400; // Much smaller spacing for visibility
        
        nodes.forEach((node, index) => {
          const nodeData = graph.graphData().nodes.find((n: any) => n.id === node.id);
          if (nodeData) {
            // Create vertical arrangement within each year frame
            const typeOffset = {
              'education': -200,
              'skill': -100,
              'job': 0,
              'project': 100,
              'certification': 200,
              'okr': 300,
              'todo': 400
            }[node.type] || 0;
            
            // Arrange nodes vertically by type, spread horizontally by sequence within year
            const y = typeOffset + (Math.floor(index / 2) * 150) - 75;
            const z = (index % 2) * 200 - 100; // Depth variation for better visibility
            
            // Fix node position in year frame
            nodeData.fx = x + ((index % 4) * 50 - 75); // Small horizontal spread within year
            nodeData.fy = y;
            nodeData.fz = z;
          }
        });
      });
      
      // Refresh the graph
      graph.refresh();
      
      // Add visual elements after a short delay
      setTimeout(() => {
        addTimeAxisLabels();
      }, 1000);
    }
  }, [timelineData]);

  // Node interaction handlers
  const handleNodeHover = (node: any) => {
    setHoveredNode(node);
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  // Custom node rendering with date labels
  const renderNode = (node: TemporalNode) => {
    if (typeof window === 'undefined' || !(window as any).THREE) {
      return null;
    }
    
    try {
      const THREE = (window as any).THREE;
      const group = new THREE.Group();
      
      // Create the main node geometry
      const geometry = getNodeGeometry(node.type);
      const material = new THREE.MeshLambertMaterial({ 
        color: node.visualProperties.color,
        transparent: true,
        opacity: node.visualProperties.opacity,
        emissive: node.visualProperties.color,
        emissiveIntensity: 0.2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      
      // Add date label sprite
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 256;
        canvas.height = 128;
        context.font = 'bold 20px Arial';
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#000000';
        context.lineWidth = 3;
        
        const date = new Date(node.temporalMetadata.t_valid);
        const dateStr = `${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
        const typeStr = node.type.charAt(0).toUpperCase() + node.type.slice(1);
        
        // Draw text with outline for better visibility
        context.strokeText(node.name, 10, 40);
        context.fillText(node.name, 10, 40);
        
        context.font = '16px Arial';
        context.strokeText(`${typeStr} • ${dateStr}`, 10, 70);
        context.fillText(`${typeStr} • ${dateStr}`, 10, 70);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
          map: texture,
          opacity: 0.9
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(2, 2, 0);
        sprite.scale.set(8, 4, 1);
        group.add(sprite);
      }
      
      // Add glow effect for active nodes
      if (node.temporalMetadata.isActive) {
        const glowGeometry = geometry.clone();
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: node.visualProperties.color,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.scale.multiplyScalar(1.3);
        group.add(glowMesh);
      }
      
      return group;
    } catch (error) {
      console.error('Error creating 3D node:', error);
      return null;
    }
  };

  // Get node geometry based on type
  const getNodeGeometry = (type: string) => {
    if (typeof window === 'undefined' || !(window as any).THREE) {
      return null;
    }
    
    const THREE = (window as any).THREE;
    
    try {
      switch (type) {
        case 'skill':
          return new THREE.SphereGeometry(0.5, 16, 16);
        case 'job':
          return new THREE.BoxGeometry(1, 1, 1);
        case 'education':
          return new THREE.ConeGeometry(0.5, 1, 8);
        case 'certification':
          return new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        case 'project':
          return new THREE.OctahedronGeometry(0.6);
        case 'okr':
          return new THREE.TetrahedronGeometry(0.7);
        case 'todo':
          return new THREE.IcosahedronGeometry(0.4);
        default:
          return new THREE.SphereGeometry(0.4, 12, 12);
      }
    } catch (error) {
      console.error('Error creating geometry:', error);
      return new THREE.SphereGeometry(0.4, 12, 12);
    }
  };

  // Time range slider handler
  const handleTimeRangeChange = (newRange: number[]) => {
    setSelectedTimeRange([newRange[0], newRange[1]]);
  };

  // Reset camera position for horizontal timeline view
  const resetCamera = () => {
    if (graphRef.current) {
      // Position camera to view the horizontal timeline from above and angled
      graphRef.current.cameraPosition({ x: 800, y: 400, z: 600 }, { x: 800, y: 0, z: 0 });
    }
  };

  // Add time axis labels to the 3D scene
  const addTimeAxisLabels = () => {
    if (!graphRef.current || typeof window === 'undefined' || !(window as any).THREE) return;
    
    const THREE = (window as any).THREE;
    const scene = graphRef.current.scene();
    
    // Remove existing axis group if any
    const existingAxis = scene.getObjectByName('timeAxis');
    if (existingAxis) scene.remove(existingAxis);
    
    // Create axis group
    const axisGroup = new THREE.Group();
    axisGroup.name = 'timeAxis';
    
    // Add horizontal time axis line (left to right)
    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1000, -400, 0),
      new THREE.Vector3(2000, -400, 0)
    ]);
    const axisMaterial = new THREE.LineBasicMaterial({ color: 0x4a5568 });
    const axisLine = new THREE.Line(axisGeometry, axisMaterial);
    axisGroup.add(axisLine);
    
    // Add year labels, grids, and visual planes
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x2a2a2a, opacity: 0.3, transparent: true });
    
    years.forEach((year, index) => {
      const x = (year - 2020) * 400; // Map years to X position (400 units apart)
      
      // Add tick mark
      const tickGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -400, 0),
        new THREE.Vector3(x, -450, 0)
      ]);
      const tickLine = new THREE.Line(tickGeometry, axisMaterial);
      axisGroup.add(tickLine);
      
      // Add year text with larger, more prominent styling
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 256;
        canvas.height = 128;
        context.font = 'bold 36px Arial';
        context.fillStyle = year === 2024 ? '#ffffff' : '#888888';
        context.strokeStyle = '#000000';
        context.lineWidth = 2;
        
        // Add glow effect for current year
        if (year === 2024) {
          context.shadowColor = '#4fc3f7';
          context.shadowBlur = 10;
        }
        
        context.strokeText(year.toString(), 20, 70);
        context.fillText(year.toString(), 20, 70);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, -500, 0);
        sprite.scale.set(60, 30, 1);
        axisGroup.add(sprite);
      }
      
      // Add vertical year plane for visual effect
      const planeGeometry = new THREE.PlaneGeometry(100, 600);
      const planeMaterial = new THREE.MeshBasicMaterial({
        color: year === 2024 ? 0x4fc3f7 : 0x333366,
        transparent: true,
        opacity: year === 2024 ? 0.15 : 0.05,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeometry, planeMaterial);
      plane.position.set(x, 0, 0);
      plane.rotation.y = 0; // Keep vertical for left-right timeline
      axisGroup.add(plane);
      
      // Add vertical grid wireframe for each year
      const gridGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - 50, -300, -200),
        new THREE.Vector3(x + 50, -300, -200),
        new THREE.Vector3(x + 50, 300, -200),
        new THREE.Vector3(x - 50, 300, -200),
        new THREE.Vector3(x - 50, -300, -200)
      ]);
      const gridLine = new THREE.Line(gridGeometry, gridMaterial);
      axisGroup.add(gridLine);
      
      // Add cross-grid lines for better depth perception within year frame
      for (let i = -300; i <= 300; i += 100) {
        // Horizontal grid lines
        const hGridGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x - 50, i, -200),
          new THREE.Vector3(x + 50, i, -200)
        ]);
        const hGridLine = new THREE.Line(hGridGeometry, gridMaterial);
        axisGroup.add(hGridLine);
      }
    });
    
    // Add horizontal axis labels
    ['Past', 'Present', 'Future'].forEach((label, i) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = 512;
        canvas.height = 128;
        context.font = 'bold 48px Arial';
        context.fillStyle = '#4a5568';
        context.fillText(label, 20, 80);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, opacity: 0.7 });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(-800 + (i * 800), -600, 0); // Spread along X-axis
        sprite.scale.set(120, 30, 1);
        axisGroup.add(sprite);
      }
    });
    
    scene.add(axisGroup);
  };

  // Add progression lines showing career timeline flow
  const addProgressionLines = () => {
    if (!graphRef.current || typeof window === 'undefined' || !(window as any).THREE || !timelineData) return;
    
    const THREE = (window as any).THREE;
    const scene = graphRef.current.scene();
    
    // Remove existing progression lines
    const existingLines = scene.getObjectByName('progressionLines');
    if (existingLines) scene.remove(existingLines);
    
    const lineGroup = new THREE.Group();
    lineGroup.name = 'progressionLines';
    
    // Sort nodes by date to create chronological flow
    const sortedNodes = [...timelineData.nodes].sort((a, b) => 
      new Date(a.temporalMetadata.t_valid).getTime() - new Date(b.temporalMetadata.t_valid).getTime()
    );
    
    // Create flowing timeline spine (left to right)
    const spinePoints = sortedNodes.map(node => {
      const year = new Date(node.temporalMetadata.t_valid).getFullYear();
      const x = (year - 2020) * 400;
      return new THREE.Vector3(x, -300, 0);
    });
    
    if (spinePoints.length > 1) {
      const spineGeometry = new THREE.BufferGeometry().setFromPoints(spinePoints);
      const spineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x4fc3f7, 
        linewidth: 5,
        opacity: 0.8,
        transparent: true
      });
      const spineLine = new THREE.Line(spineGeometry, spineMaterial);
      lineGroup.add(spineLine);
    }
    
    // Add pulsing particles along the timeline
    const particleCount = 50;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const progress = i / particleCount;
      const x = -800 + (progress * 2400); // Spread along X-axis timeline (from -800 to 1600)
      positions[i * 3] = x;
      positions[i * 3 + 1] = -300 + Math.sin(progress * Math.PI * 8) * 50;
      positions[i * 3 + 2] = Math.cos(progress * Math.PI * 6) * 30;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x4fc3f7,
      size: 2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6
    });
    
    const particleSystem = new THREE.Points(particles, particleMaterial);
    lineGroup.add(particleSystem);
    
    scene.add(lineGroup);
  };

  // Animate to time period
  const animateToTimePeriod = (year: number) => {
    if (!timelineData || !graphRef.current) return;
    
    const targetNodes = timelineData.nodes.filter(node => 
      node.temporalMetadata.t_valid.getFullYear() === year
    );
    
    if (targetNodes.length > 0) {
      const avgPosition = targetNodes.reduce(
        (acc, node) => ({
          x: acc.x + node.position.x,
          y: acc.y + node.position.y,
          z: acc.z + node.position.z
        }),
        { x: 0, y: 0, z: 0 }
      );
      
      avgPosition.x /= targetNodes.length;
      avgPosition.y /= targetNodes.length;
      avgPosition.z /= targetNodes.length;
      
      graphRef.current.cameraPosition(
        { x: avgPosition.x, y: avgPosition.y, z: avgPosition.z + 200 },
        { x: avgPosition.x, y: avgPosition.y, z: avgPosition.z },
        1000
      );
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please sign in to view your temporal timeline
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Building your temporal timeline...</div>
              <div className="text-sm text-muted-foreground">
                Processing career events across time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <div className="text-lg font-medium mb-2">Error loading timeline</div>
            <div className="text-sm">{error}</div>
            <Button onClick={fetchTimelineData} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const graphHeight = isFullscreen ? '100vh' : '600px';

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50' : 'w-full'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            3D Temporal Timeline
          </CardTitle>
          {stats && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.totalNodes} events</Badge>
              <Badge variant="secondary">{stats.timeSpan} years</Badge>
              <Badge variant="secondary">{stats.activeNodes} active</Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={resetCamera} variant="outline" size="sm">
            Reset View
          </Button>
          <Button 
            onClick={() => setIsFullscreen(!isFullscreen)} 
            variant="outline" 
            size="sm"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Time Range Controls */}
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-4 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Time Range:</span>
            <span className="text-sm text-muted-foreground">
              {selectedTimeRange[0]} - {selectedTimeRange[1]}
            </span>
          </div>
          <Slider
            value={selectedTimeRange}
            onValueChange={handleTimeRangeChange}
            min={2000}
            max={2030}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            <Button 
              onClick={() => animateToTimePeriod(selectedTimeRange[0])} 
              variant="outline" 
              size="sm"
            >
              Go to {selectedTimeRange[0]}
            </Button>
            <Button 
              onClick={() => animateToTimePeriod(selectedTimeRange[1])} 
              variant="outline" 
              size="sm"
            >
              Go to {selectedTimeRange[1]}
            </Button>
          </div>
        </div>

        {/* 3D Timeline Visualization */}
        <div style={{ height: graphHeight }}>
          {timelineData ? (
            <div className="relative">
              <ForceGraph3D
                ref={graphRef}
                graphData={timelineData}
                nodeLabel={(node: any) => `${node.name} (${new Date(node.temporalMetadata?.t_valid).getFullYear()})`}
                nodeColor={(node: any) => node.visualProperties?.color || '#666'}
                nodeVal={(node: any) => node.visualProperties?.size || 1}
                nodeOpacity={0.9}
                linkColor={(link: any) => {
                  // Color links based on relationship type
                  const colors: Record<string, string> = {
                    'skill_to_job': '#00ff88',
                    'education_to_skill': '#ffaa00', 
                    'job_to_project': '#ff4488',
                    'default': '#ffffff'
                  };
                  return colors[link.type] || colors.default;
                }}
                linkOpacity={0.6}
                linkWidth={3}
                // Custom node rendering
                nodeThreeObject={renderNode}
                nodeThreeObjectExtend={true}
                // Interactions
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                // Performance
                warmupTicks={0}
                cooldownTicks={0}
                cooldownTime={Infinity}
                // Custom forces
                numDimensions={3}
                // Background
                backgroundColor="#000015"
                // Camera controls
                enableNavigationControls={true}
                showNavInfo={true}
                // Custom scene modifications
                onEngineStop={() => {
                  if (graphRef.current) {
                    // Add time axis labels and progression lines
                    addTimeAxisLabels();
                    addProgressionLines();
                  }
                }}
              />
              {error && (
                <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-200 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* Debug Panel */}
              <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-md text-xs max-w-xs">
                <div className="font-semibold mb-1">Debug Info</div>
                <div>Data Source: {error?.includes('sample data') ? 'Sample Data' : userId ? 'User Data' : 'Debug Endpoint'}</div>
                <div>Nodes: {timelineData.nodes.length}</div>
                <div>Links: {timelineData.links.length}</div>
                <div>Time Range: {new Date(timelineData.timeRange.start).getFullYear()} - {new Date(timelineData.timeRange.end).getFullYear()}</div>
                <div className="mt-2">
                  <div className="font-semibold">Legend:</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> Skills</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Jobs</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-500 rounded-full inline-block"></span> Education</div>
                  <div className="flex items-center gap-1"><span className="w-3 h-3 bg-purple-500 rounded-full inline-block"></span> Projects</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No timeline data available
            </div>
          )}
        </div>

        {/* Node Details Panel */}
        {(hoveredNode || selectedNode) && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              {((hoveredNode || selectedNode)?.type === 'company') && <Briefcase className="h-4 w-4" />}
              {((hoveredNode || selectedNode)?.type === 'skill') && <Award className="h-4 w-4" />}
              {((hoveredNode || selectedNode)?.type === 'institution') && <BookOpen className="h-4 w-4" />}
              {((hoveredNode || selectedNode)?.type === 'user') && <Users className="h-4 w-4" />}
              <span className="font-medium">{(hoveredNode || selectedNode)?.name}</span>
              <Badge variant="outline">{(hoveredNode || selectedNode)?.type}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Started:</span>
                <div>{(hoveredNode || selectedNode)?.temporalMetadata.t_valid.toLocaleDateString()}</div>
              </div>
              {(hoveredNode || selectedNode)?.temporalMetadata.t_invalid && (
                <div>
                  <span className="text-muted-foreground">Ended:</span>
                  <div>{(hoveredNode || selectedNode)?.temporalMetadata.t_invalid?.toLocaleDateString()}</div>
                </div>
              )}
              {(hoveredNode || selectedNode)?.temporalMetadata.duration && (
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <div>{(hoveredNode || selectedNode)?.temporalMetadata.duration} months</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={(hoveredNode || selectedNode)?.temporalMetadata.isActive ? 'default' : 'secondary'}>
                  {(hoveredNode || selectedNode)?.temporalMetadata.isActive ? 'Active' : 'Completed'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Statistics */}
        {stats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalNodes}</div>
              <div className="text-sm text-muted-foreground">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.timeSpan}</div>
              <div className="text-sm text-muted-foreground">Years Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.activeNodes}</div>
              <div className="text-sm text-muted-foreground">Active Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalLinks}</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}