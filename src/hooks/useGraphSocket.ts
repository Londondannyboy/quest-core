import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';
import { GraphUpdateEvent, ConversationGraphEvent } from '@/lib/socket-server';

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

export const useGraphSocket = (userId?: string) => {
  const { isSignedIn } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graphDataRef = useRef<GraphData>({ nodes: [], links: [] });

  // Initialize socket connection
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const socketInstance = io({
      path: '/api/socket',
      addTrailingSlash: false
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnected(true);
      setError(null);
      
      // Authenticate with the server
      socketInstance.emit('authenticate', { userId });
    });

    socketInstance.on('authenticated', (data) => {
      console.log('Authenticated successfully:', data);
    });

    socketInstance.on('authentication_error', (data) => {
      console.error('Authentication failed:', data);
      setError('Authentication failed');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Connection failed');
      setConnected(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [isSignedIn, userId]);

  // Handle graph updates
  useEffect(() => {
    if (!socket) return;

    const handleGraphUpdate = (update: GraphUpdateEvent) => {
      console.log('Received graph update:', update);
      
      setGraphData(prevData => {
        const newData = { ...prevData };
        
        switch (update.type) {
          case 'node_added':
            // Add new node if it doesn't exist
            if (!newData.nodes.find(node => node.id === update.data.id)) {
              newData.nodes = [...newData.nodes, {
                id: update.data.id!,
                name: update.data.name!,
                type: update.data.type!,
                color: update.data.color!,
                size: update.data.size!,
                metadata: update.data.metadata
              }];
            }
            break;
            
          case 'relationship_added':
            // Add new relationship if it doesn't exist
            if (!newData.links.find(link => 
              link.source === update.data.source && 
              link.target === update.data.target && 
              link.type === update.data.relationshipType
            )) {
              newData.links = [...newData.links, {
                source: update.data.source!,
                target: update.data.target!,
                type: update.data.relationshipType!,
                strength: update.data.strength!,
                metadata: update.data.metadata
              }];
            }
            break;
            
          case 'node_updated':
            // Update existing node
            newData.nodes = newData.nodes.map(node => 
              node.id === update.data.id 
                ? { ...node, ...update.data }
                : node
            );
            break;
            
          case 'node_removed':
            // Remove node and its relationships
            newData.nodes = newData.nodes.filter(node => node.id !== update.data.id);
            newData.links = newData.links.filter(link => 
              link.source !== update.data.id && link.target !== update.data.id
            );
            break;
        }
        
        graphDataRef.current = newData;
        return newData;
      });
    };

    const handleConversationUpdate = (update: ConversationGraphEvent) => {
      console.log('Received conversation update:', update);
      
      // Show system message or trigger animation
      // This could trigger specific UI feedback
    };

    const handleSystemMessage = (data: { message: string; timestamp: string }) => {
      console.log('System message:', data.message);
    };

    socket.on('graph_update', handleGraphUpdate);
    socket.on('conversation_update', handleConversationUpdate);
    socket.on('system_message', handleSystemMessage);

    return () => {
      socket.off('graph_update', handleGraphUpdate);
      socket.off('conversation_update', handleConversationUpdate);
      socket.off('system_message', handleSystemMessage);
    };
  }, [socket]);

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
      graphDataRef.current = transformedData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph data');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Send conversation action to server
  const sendConversationAction = useCallback((action: 'add_skill' | 'add_company' | 'add_education' | 'update_profile', entity: string, details?: any) => {
    if (!socket || !userId) return;
    
    const event: ConversationGraphEvent = {
      type: 'conversation_update',
      userId,
      data: { action, entity, details },
      timestamp: new Date().toISOString()
    };
    
    socket.emit('conversation_action', event);
  }, [socket, userId]);

  return {
    connected,
    graphData,
    isLoading,
    error,
    initializeGraphData,
    sendConversationAction
  };
};