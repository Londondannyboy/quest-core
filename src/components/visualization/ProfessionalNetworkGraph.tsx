'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dynamic import to avoid SSR issues with 3D components
const ForceGraph3D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph3D), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-96">Loading 3D Graph...</div>
});

interface GraphNode {
  id: string;
  name: string;
  type: 'user' | 'company' | 'skill' | 'institution';
  color: string;
  size: number;
  metadata?: any;
}

interface GraphLink {
  source: string;
  target: string;
  type: 'works_at' | 'has_skill' | 'studied_at';
  strength: number;
  metadata?: any;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    totalNodes: number;
    totalLinks: number;
    companies: number;
    skills: number;
    institutions: number;
  };
}

export function ProfessionalNetworkGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNodeTypes, setShowNodeTypes] = useState({
    user: true,
    company: true,
    skill: true,
    institution: true
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const graphRef = useRef<any>();

  useEffect(() => {
    fetchGraphData();
  }, []);

  const fetchGraphData = async () => {
    try {
      const response = await fetch('/api/visualization/professional-graph');
      if (!response.ok) {
        throw new Error('Failed to fetch graph data');
      }
      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (!graphData) return { nodes: [], links: [] };
    
    const filteredNodes = graphData.nodes.filter(node => showNodeTypes[node.type]);
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    const filteredLinks = graphData.links.filter(link => 
      nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  };

  const getNodeLabel = (node: any) => {
    switch (node.type) {
      case 'user':
        return `👤 ${node.name}`;
      case 'company':
        return `🏢 ${node.name}${node.metadata?.industry ? ` (${node.metadata.industry})` : ''}`;
      case 'skill':
        return `⚡ ${node.name}${node.metadata?.category ? ` - ${node.metadata.category}` : ''}`;
      case 'institution':
        return `🎓 ${node.name}${node.metadata?.type ? ` (${node.metadata.type})` : ''}`;
      default:
        return node.name || node.id;
    }
  };

  const getLinkLabel = (link: any) => {
    switch (link.type) {
      case 'works_at':
        return `Works at ${typeof link.target === 'string' ? 'company' : (link.target as any).name}`;
      case 'has_skill':
        return `Has skill: ${typeof link.target === 'string' ? 'skill' : (link.target as any).name}`;
      case 'studied_at':
        return `Studied at ${typeof link.target === 'string' ? 'institution' : (link.target as any).name}`;
      default:
        return link.type;
    }
  };

  const toggleNodeType = (type: keyof typeof showNodeTypes) => {
    setShowNodeTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const resetCamera = () => {
    if (graphRef.current) {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 400 });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-muted-foreground">Loading 3D professional network...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-semibold mb-2">No Network Data Available</h3>
            <p>Add work experience, skills, or education data to see your professional network visualization.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredData = getFilteredData();
  const graphHeight = isFullscreen ? '100vh' : '600px';

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50' : 'w-full'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>3D Professional Network</CardTitle>
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
      <CardContent className="p-6">
        {/* Control Panel */}
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="text-sm font-medium">Show:</div>
          {Object.entries(showNodeTypes).map(([type, visible]) => (
            <Button
              key={type}
              onClick={() => toggleNodeType(type as keyof typeof showNodeTypes)}
              variant={visible ? "default" : "outline"}
              size="sm"
              className="capitalize"
            >
              {type === 'user' && '👤'} 
              {type === 'company' && '🏢'} 
              {type === 'skill' && '⚡'} 
              {type === 'institution' && '🎓'} 
              {type}s ({graphData.stats[type === 'user' ? 'totalNodes' : type === 'company' ? 'companies' : type === 'skill' ? 'skills' : 'institutions'] || 0})
            </Button>
          ))}
        </div>

        {/* 3D Graph */}
        <div style={{ height: graphHeight, width: '100%' }}>
          <ForceGraph3D
            ref={graphRef}
            graphData={filteredData}
            nodeLabel={getNodeLabel}
            nodeColor={(node: any) => node.color}
            nodeVal={(node: any) => node.size}
            linkLabel={getLinkLabel}
            linkWidth={(link: any) => link.strength}
            linkOpacity={0.6}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.006}
            linkDirectionalParticleWidth={2}
            backgroundColor="rgba(0,0,0,0.1)"
            showNavInfo={false}
            controlType="orbit"
            onNodeClick={(node: any) => {
              console.log('Node clicked:', node);
              // Could implement node detail modal here
            }}
            onLinkClick={(link: any) => {
              console.log('Link clicked:', link);
              // Could implement link detail modal here
            }}
          />
        </div>

        {/* Graph Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{graphData.stats.totalNodes}</div>
            <div className="text-gray-500">Total Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{graphData.stats.totalLinks}</div>
            <div className="text-gray-500">Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{graphData.stats.companies}</div>
            <div className="text-gray-500">Companies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{graphData.stats.skills}</div>
            <div className="text-gray-500">Skills</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{graphData.stats.institutions}</div>
            <div className="text-gray-500">Institutions</div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>You (Center)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Companies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span>Skills</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            <span>Education</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Controls:</strong> Drag to rotate • Scroll to zoom • Right-click to pan</p>
          <p><strong>Tips:</strong> Node size reflects experience/tenure • Animated particles show relationship strength</p>
        </div>
      </CardContent>
    </Card>
  );
}