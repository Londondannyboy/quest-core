import { ZepClient } from '@getzep/zep-js';

export interface TrinityData {
  quest?: string;
  service?: string;
  pledge?: string;
  lastUpdated?: Date;
  confidence?: number;
}

export interface CoachingContext {
  sessionId: string;
  userId: string;
  relevantFacts: string[];
  trinity: TrinityData | null;
  userPreferences: Record<string, any>;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    coach?: string;
  }>;
  insights: string[];
}

export interface SessionSummary {
  sessionId: string;
  userId: string;
  keyPoints: string[];
  emotionalTone: string;
  progressIndicators: string[];
  trinityEvolution: TrinityData | null;
  nextSessionRecommendations: string[];
}

/**
 * Zep Client for Quest Core - Conversational Memory Management
 * Provides persistent memory, context extraction, and Trinity evolution tracking
 */
export class QuestZepClient {
  private zep: ZepClient;
  private initialized: boolean = false;

  constructor() {
    // Initialize Zep client with API key
    this.zep = new ZepClient({
      apiKey: process.env.ZEP_API_KEY!,
      baseUrl: process.env.ZEP_BASE_URL || 'https://api.getzep.com'
    });
  }

  /**
   * Initialize user in Zep if not exists
   */
  async initializeUser(userId: string, userEmail?: string, userName?: string): Promise<void> {
    try {
      // Check if user already exists
      try {
        await this.zep.user.get(userId);
        console.log('[Zep] User already exists:', userId);
        return;
      } catch (error) {
        // User doesn't exist, create them
        console.log('[Zep] Creating new user:', userId);
      }

      await this.zep.user.add({
        userId: userId,
        email: userEmail,
        firstName: userName || 'Quest User',
        metadata: {
          platform: 'quest-core',
          createdAt: new Date().toISOString()
        }
      });

      console.log('[Zep] User initialized successfully:', userId);
    } catch (error) {
      console.error('[Zep] Error initializing user:', error);
      throw error;
    }
  }

  /**
   * Create a new coaching session in Zep
   */
  async createSession(userId: string, sessionId: string, sessionType: string): Promise<void> {
    try {
      await this.zep.memory.addSession({
        sessionId: sessionId,
        userId: userId,
        metadata: {
          sessionType,
          platform: 'quest-core-voice',
          startTime: new Date().toISOString()
        }
      });

      console.log('[Zep] Session created:', { userId, sessionId, sessionType });
    } catch (error) {
      console.error('[Zep] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Add a message to the conversation in Zep
   */
  async addMessage(
    sessionId: string, 
    role: 'user' | 'assistant', 
    content: string, 
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.zep.memory.add(sessionId, {
        messages: [{
          role: role,
          content: content,
          metadata: {
            timestamp: new Date().toISOString(),
            ...metadata
          }
        }]
      });

      console.log('[Zep] Message added:', { sessionId, role, contentLength: content.length });
    } catch (error) {
      console.error('[Zep] Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get coaching context for a user session
   */
  async getCoachingContext(
    userId: string, 
    currentMessage: string, 
    sessionId?: string
  ): Promise<CoachingContext> {
    try {
      // Get recent conversation history if session exists
      let conversationHistory: CoachingContext['conversationHistory'] = [];
      if (sessionId) {
        try {
          const memory = await this.zep.memory.get(sessionId);
          const messages = await this.zep.memory.getSessionMessages(sessionId, { limit: 10 });
          
          conversationHistory = messages.messages?.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content || '',
            timestamp: new Date(msg.createdAt || Date.now()),
            coach: msg.metadata?.coach as string
          })) || [];
        } catch (error) {
          console.log('[Zep] Session not found, starting fresh:', sessionId);
        }
      }

      // Extract user preferences and insights
      const userSummary = await this.getUserSummary(userId);

      return {
        sessionId: sessionId || 'new-session',
        userId,
        relevantFacts: [], // Will implement search later
        trinity: this.extractTrinityFromSummary(userSummary),
        userPreferences: userSummary?.metadata || {},
        conversationHistory,
        insights: this.extractInsightsFromHistory(conversationHistory)
      };

    } catch (error) {
      console.error('[Zep] Error getting coaching context:', error);
      
      // Return minimal context on error
      return {
        sessionId: sessionId || 'new-session',
        userId,
        relevantFacts: [],
        trinity: null,
        userPreferences: {},
        conversationHistory: [],
        insights: []
      };
    }
  }

  /**
   * Get session summary and extract insights
   */
  async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
    try {
      const memory = await this.zep.memory.get(sessionId);
      if (!memory || !memory.summary) {
        return null;
      }

      const summary = memory.summary;
      
      return {
        sessionId,
        userId: (memory as any).userId || 'unknown',
        keyPoints: this.extractKeyPoints(summary.content || ''),
        emotionalTone: (summary.metadata as any)?.emotionalTone || 'neutral',
        progressIndicators: this.extractProgressIndicators(summary.content || ''),
        trinityEvolution: this.extractTrinityFromContent(summary.content || ''),
        nextSessionRecommendations: this.generateNextSessionRecommendations(summary.content || '')
      };

    } catch (error) {
      console.error('[Zep] Error getting session summary:', error);
      return null;
    }
  }

  /**
   * Update Trinity information for a user
   */
  async updateTrinity(userId: string, trinity: Partial<TrinityData>): Promise<void> {
    try {
      const currentUser = await this.zep.user.get(userId);
      const currentTrinity = currentUser.metadata?.trinity || {};

      const updatedTrinity = {
        ...currentTrinity,
        ...trinity,
        lastUpdated: new Date().toISOString()
      };

      await this.zep.user.update(userId, {
        metadata: {
          ...currentUser.metadata,
          trinity: updatedTrinity
        }
      });

      console.log('[Zep] Trinity updated for user:', userId);
    } catch (error) {
      console.error('[Zep] Error updating Trinity:', error);
      throw error;
    }
  }

  /**
   * Test Zep connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list users to test connection
      const testUserId = `test-${Date.now()}`;
      await this.zep.user.add({
        userId: testUserId,
        metadata: { test: true }
      });
      
      // Clean up test user
      await this.zep.user.delete(testUserId);
      
      console.log('[Zep] Connection test successful');
      return true;
    } catch (error) {
      console.error('[Zep] Connection test failed:', error);
      return false;
    }
  }

  // Private helper methods

  private async getUserSummary(userId: string): Promise<any> {
    try {
      return await this.zep.user.get(userId);
    } catch (error) {
      console.log('[Zep] User summary not found:', userId);
      return null;
    }
  }

  private extractTrinityFromSummary(userSummary: any): TrinityData | null {
    if (!userSummary?.metadata?.trinity) return null;
    
    return {
      quest: userSummary.metadata.trinity.quest,
      service: userSummary.metadata.trinity.service,
      pledge: userSummary.metadata.trinity.pledge,
      lastUpdated: new Date(userSummary.metadata.trinity.lastUpdated || Date.now()),
      confidence: userSummary.metadata.trinity.confidence || 0.5
    };
  }

  private extractTrinityFromContent(content: string): TrinityData | null {
    // Simple pattern matching for Trinity elements
    const questMatch = content.match(/quest[:\s]+([^\.]+)/i);
    const serviceMatch = content.match(/service[:\s]+([^\.]+)/i);
    const pledgeMatch = content.match(/pledge[:\s]+([^\.]+)/i);

    if (!questMatch && !serviceMatch && !pledgeMatch) return null;

    return {
      quest: questMatch?.[1]?.trim(),
      service: serviceMatch?.[1]?.trim(),
      pledge: pledgeMatch?.[1]?.trim(),
      lastUpdated: new Date(),
      confidence: 0.7
    };
  }

  private extractKeyPoints(content: string): string[] {
    // Extract key points from session content
    return content
      .split(/[\.!?]/)
      .filter(sentence => sentence.trim().length > 20)
      .slice(0, 5)
      .map(point => point.trim());
  }

  private extractProgressIndicators(content: string): string[] {
    const progressWords = ['improved', 'developed', 'learned', 'realized', 'discovered', 'achieved'];
    return content
      .toLowerCase()
      .split(/[\.!?]/)
      .filter(sentence => progressWords.some(word => sentence.includes(word)))
      .slice(0, 3)
      .map(indicator => indicator.trim());
  }

  private generateNextSessionRecommendations(content: string): string[] {
    // Simple recommendations based on content
    const recommendations = [];
    
    if (content.toLowerCase().includes('career')) {
      recommendations.push('Continue exploring career transition strategies');
    }
    if (content.toLowerCase().includes('skill')) {
      recommendations.push('Focus on specific skill development plan');
    }
    if (content.toLowerCase().includes('leadership')) {
      recommendations.push('Dive deeper into leadership scenarios');
    }
    
    return recommendations.slice(0, 3);
  }

  private extractInsightsFromHistory(history: CoachingContext['conversationHistory']): string[] {
    // Extract insights from conversation patterns
    const insights = [];
    
    if (history.length > 5) {
      insights.push('User is engaged in extended conversation');
    }
    
    const userMessages = history.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      const avgLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length;
      if (avgLength > 50) {
        insights.push('User provides detailed responses');
      }
    }
    
    return insights;
  }
}

// Singleton instance for use across the application
export const zepClient = new QuestZepClient();