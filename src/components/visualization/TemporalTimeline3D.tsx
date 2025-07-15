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

      const response = await fetch(`/api/temporal/timeline?${params}`);
      const result = await response.json();

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

  // Node interaction handlers
  const handleNodeHover = (node: any) => {
    setHoveredNode(node);
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  // Custom node rendering
  const renderNode = (node: TemporalNode) => {
    if (typeof window === 'undefined' || !(window as any).THREE) {
      return null;
    }
    
    try {
      const geometry = getNodeGeometry(node.type);
      const material = new (window as any).THREE.MeshLambertMaterial({ 
        color: node.visualProperties.color,
        transparent: true,
        opacity: node.visualProperties.opacity
      });
      
      return new (window as any).THREE.Mesh(geometry, material);
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

  // Reset camera position
  const resetCamera = () => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 400 });
    }
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
                nodeLabel="name"
                nodeColor={(node: any) => node.visualProperties?.color || '#666'}
                nodeVal={(node: any) => node.visualProperties?.size || 1}
                nodeOpacity={0.9}
                linkColor={() => '#ffffff'}
                linkOpacity={0.4}
                linkWidth={2}
                // Custom node rendering
                nodeThreeObject={renderNode}
                // Interactions
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                // Performance
                warmupTicks={100}
                cooldownTicks={200}
                // Custom forces
                numDimensions={3}
                // Background
                backgroundColor="#000015"
              />
              {error && (
                <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-200 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}
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