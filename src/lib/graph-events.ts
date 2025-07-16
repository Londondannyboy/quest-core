import { GraphUpdateEvent, ConversationGraphEvent } from './socket-server';

// Utility to broadcast graph updates from API routes
export class GraphEventBroadcaster {
  
  // Broadcast when a new node is added
  static async broadcastNodeAdded(userId: string, nodeData: {
    id: string;
    name: string;
    type: 'user' | 'company' | 'skill' | 'institution';
    color: string;
    size: number;
    metadata?: any;
  }) {
    const event: GraphUpdateEvent = {
      type: 'node_added',
      userId,
      data: nodeData,
      timestamp: new Date().toISOString()
    };

    await this.broadcastToSockets(event);
  }

  // Broadcast when a relationship is added
  static async broadcastRelationshipAdded(userId: string, relationshipData: {
    id: string;
    source: string;
    target: string;
    relationshipType: string;
    strength: number;
    metadata?: any;
  }) {
    const event: GraphUpdateEvent = {
      type: 'relationship_added',
      userId,
      data: relationshipData,
      timestamp: new Date().toISOString()
    };

    await this.broadcastToSockets(event);
  }

  // Broadcast conversation-based updates
  static async broadcastConversationUpdate(userId: string, action: 'add_skill' | 'add_company' | 'add_education' | 'add_objective' | 'add_key_result' | 'update_profile', entity: string, details?: any) {
    const event: ConversationGraphEvent = {
      type: 'conversation_update',
      userId,
      data: {
        action,
        entity,
        details
      },
      timestamp: new Date().toISOString()
    };

    await this.broadcastToSockets(event);
  }

  // Send to WebSocket clients
  private static async broadcastToSockets(event: GraphUpdateEvent | ConversationGraphEvent) {
    // Access the global Socket.IO instance
    const io = (global as any).io;
    
    if (!io) {
      console.warn('Socket.IO not available, skipping broadcast');
      return;
    }

    try {
      if (event.type === 'conversation_update') {
        io.to(`user:${event.userId}`).emit('conversation_update', event);
      } else {
        io.to(`user:${event.userId}`).emit('graph_update', event);
      }
      
      console.log('Broadcasted event:', event.type, 'to user:', event.userId);
    } catch (error) {
      console.error('Error broadcasting event:', error);
    }
  }

  // Helper functions for common graph operations
  static async skillAdded(userId: string, skillName: string, skillId: string, proficiency: string, experience: number) {
    await this.broadcastNodeAdded(userId, {
      id: skillId,
      name: skillName,
      type: 'skill',
      color: '#8b5cf6',
      size: 10 + experience,
      metadata: { proficiency, experience }
    });

    await this.broadcastRelationshipAdded(userId, {
      id: `${userId}-has-skill-${skillId}`,
      source: userId,
      target: skillId,
      relationshipType: 'HAS_SKILL',
      strength: Math.min(experience / 5, 3),
      metadata: { proficiency, experience }
    });
  }

  static async companyAdded(userId: string, companyName: string, companyId: string, role: string, industry?: string) {
    await this.broadcastNodeAdded(userId, {
      id: companyId,
      name: companyName,
      type: 'company',
      color: '#10b981',
      size: 15,
      metadata: { industry }
    });

    await this.broadcastRelationshipAdded(userId, {
      id: `${userId}-works-at-${companyId}`,
      source: userId,
      target: companyId,
      relationshipType: 'WORKS_AT',
      strength: 2,
      metadata: { role, industry }
    });
  }

  static async educationAdded(userId: string, institutionName: string, institutionId: string, degree: string, fieldOfStudy: string) {
    await this.broadcastNodeAdded(userId, {
      id: institutionId,
      name: institutionName,
      type: 'institution',
      color: '#f59e0b',
      size: 12,
      metadata: { degree, fieldOfStudy }
    });

    await this.broadcastRelationshipAdded(userId, {
      id: `${userId}-studied-at-${institutionId}`,
      source: userId,
      target: institutionId,
      relationshipType: 'STUDIED_AT',
      strength: 2,
      metadata: { degree, fieldOfStudy }
    });
  }
}