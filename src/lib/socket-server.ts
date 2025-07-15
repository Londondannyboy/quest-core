import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from './auth-helpers';

export interface GraphUpdateEvent {
  type: 'node_added' | 'node_updated' | 'node_removed' | 'relationship_added' | 'relationship_updated' | 'relationship_removed';
  userId: string;
  data: {
    id: string;
    name?: string;
    type?: 'user' | 'company' | 'skill' | 'institution';
    color?: string;
    size?: number;
    metadata?: any;
    source?: string;
    target?: string;
    relationshipType?: string;
    strength?: number;
  };
  timestamp: string;
}

export interface ConversationGraphEvent {
  type: 'conversation_update';
  userId: string;
  data: {
    action: 'add_skill' | 'add_company' | 'add_education' | 'update_profile';
    entity: string;
    details?: any;
  };
  timestamp: string;
}

export class GraphSocketServer {
  private io: SocketIOServer;
  private static instance: GraphSocketServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"]
      },
      path: '/api/socket'
    });

    this.setupEventHandlers();
  }

  static getInstance(server?: HTTPServer): GraphSocketServer {
    if (!GraphSocketServer.instance && server) {
      GraphSocketServer.instance = new GraphSocketServer(server);
    }
    return GraphSocketServer.instance;
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Handle user authentication and room joining
      socket.on('authenticate', async (data: { userId: string }) => {
        try {
          // Join user-specific room for targeted updates
          socket.join(`user:${data.userId}`);
          console.log(`User ${data.userId} joined room`);
          
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      // Handle conversation-based graph updates
      socket.on('conversation_action', (data: ConversationGraphEvent) => {
        console.log('Conversation action:', data);
        
        // Broadcast to user's room
        socket.to(`user:${data.userId}`).emit('conversation_update', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast graph update to specific user
  broadcastGraphUpdate(userId: string, update: GraphUpdateEvent) {
    console.log('Broadcasting graph update:', update);
    this.io.to(`user:${userId}`).emit('graph_update', update);
  }

  // Broadcast conversation update to specific user
  broadcastConversationUpdate(userId: string, update: ConversationGraphEvent) {
    console.log('Broadcasting conversation update:', update);
    this.io.to(`user:${userId}`).emit('conversation_update', update);
  }

  // Get connection count for user
  getUserConnectionCount(userId: string): Promise<number> {
    return new Promise((resolve) => {
      this.io.in(`user:${userId}`).fetchSockets().then(sockets => {
        resolve(sockets.length);
      });
    });
  }

  // Send system message to user
  sendSystemMessage(userId: string, message: string) {
    this.io.to(`user:${userId}`).emit('system_message', {
      message,
      timestamp: new Date().toISOString()
    });
  }
}

// Global instance holder
let globalSocketServer: GraphSocketServer | null = null;

export const getSocketServer = (server?: HTTPServer): GraphSocketServer | null => {
  if (server && !globalSocketServer) {
    globalSocketServer = GraphSocketServer.getInstance(server);
  }
  return globalSocketServer;
};

export default GraphSocketServer;