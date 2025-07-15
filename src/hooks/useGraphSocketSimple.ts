import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

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
  type: string;
  strength: number;
  metadata?: any;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Simple version without Socket.IO for testing
export const useGraphSocketSimple = (userId?: string) => {
  const { isSignedIn } = useAuth();
  const [connected, setConnected] = useState(false);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate connection status
  useEffect(() => {
    if (isSignedIn && userId) {
      setConnected(true);
      setError(null);
    } else {
      setConnected(false);
    }
  }, [isSignedIn, userId]);

  // Initialize graph data from API
  const initializeGraphData = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/visualization/professional-graph');
      if (!response.ok) throw new Error('Failed to fetch graph data');
      
      const data = await response.json();
      const transformedData: GraphData = {
        nodes: data.nodes || [],
        links: data.links || []
      };
      
      setGraphData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Send conversation action (simplified version)
  const sendConversationAction = useCallback(async (action: 'add_skill' | 'add_company' | 'add_education' | 'update_profile', entity: string, details?: any) => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/conversation/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: `${action.replace('_', ' ')} ${entity} ${details ? JSON.stringify(details) : ''}` 
        })
      });
      
      if (response.ok) {
        // Refresh graph data after conversation action
        setTimeout(() => {
          initializeGraphData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending conversation action:', error);
    }
  }, [userId, initializeGraphData]);

  return {
    connected,
    graphData,
    isLoading,
    error,
    initializeGraphData,
    sendConversationAction
  };
};