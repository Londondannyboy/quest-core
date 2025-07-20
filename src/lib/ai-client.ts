import OpenAI from 'openai';

export type CoachType = 'master' | 'career' | 'skills' | 'leadership' | 'network';

export interface ModelConfig {
  model: string;
  temperature: number;
  maxTokens?: number;
  fallback?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
}

export interface CoachingSession {
  sessionId: string;
  userId: string;
  coach: CoachType;
  message: string;
  context?: any;
}

/**
 * AI Client for Quest Core - OpenRouter Integration
 * Provides intelligent model routing for cost optimization and coach specialization
 */
export class AIClient {
  private openrouter: OpenAI;
  private modelConfigs: Record<CoachType, ModelConfig>;
  private costTracker: Map<string, number> = new Map();

  constructor() {
    // Initialize OpenRouter client
    this.openrouter = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPEN_ROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Quest Core Professional Development Platform'
      }
    });

    // Coach-specific model configurations for optimal performance and cost
    this.modelConfigs = {
      master: {
        model: 'openai/gpt-4-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        fallback: 'openai/gpt-4'
      },
      career: {
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.6,
        maxTokens: 1500,
        fallback: 'openai/gpt-4'
      },
      skills: {
        model: 'openai/gpt-4',
        temperature: 0.5,
        maxTokens: 1200,
        fallback: 'openai/gpt-3.5-turbo'
      },
      leadership: {
        model: 'google/gemini-pro',
        temperature: 0.7,
        maxTokens: 1500,
        fallback: 'openai/gpt-4'
      },
      network: {
        model: 'anthropic/claude-3-sonnet',
        temperature: 0.6,
        maxTokens: 1200,
        fallback: 'openai/gpt-3.5-turbo'
      }
    };
  }

  /**
   * Generate AI response for coaching session
   */
  async generateResponse(session: CoachingSession): Promise<AIResponse> {
    const startTime = Date.now();
    const config = this.modelConfigs[session.coach];
    
    try {
      const response = await this.callModel(config, session);
      const responseTime = Date.now() - startTime;
      
      const aiResponse: AIResponse = {
        content: response.choices[0]?.message?.content || '',
        model: config.model,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: this.calculateCost(config.model, response.usage?.total_tokens || 0),
        responseTime
      };

      // Track cost for monitoring
      this.trackCost(session.userId, aiResponse.cost);
      
      return aiResponse;
    } catch (error) {
      console.error(`Error with model ${config.model}:`, error);
      
      // Fallback to backup model
      if (config.fallback) {
        console.log(`Falling back to ${config.fallback}`);
        const fallbackConfig = { ...config, model: config.fallback };
        return this.generateResponseWithConfig(session, fallbackConfig, startTime);
      }
      
      throw error;
    }
  }

  /**
   * Generate response with specific model configuration
   */
  private async generateResponseWithConfig(
    session: CoachingSession, 
    config: ModelConfig, 
    startTime: number
  ): Promise<AIResponse> {
    try {
      const response = await this.callModel(config, session);
      const responseTime = Date.now() - startTime;
      
      return {
        content: response.choices[0]?.message?.content || '',
        model: config.model,
        tokensUsed: response.usage?.total_tokens || 0,
        cost: this.calculateCost(config.model, response.usage?.total_tokens || 0),
        responseTime
      };
    } catch (error) {
      console.error(`Fallback model ${config.model} also failed:`, error);
      throw new Error(`All models failed for coach ${session.coach}`);
    }
  }

  /**
   * Call OpenRouter API with specific configuration
   */
  private async callModel(config: ModelConfig, session: CoachingSession) {
    const messages = this.buildMessages(session);
    
    return await this.openrouter.chat.completions.create({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: false
    });
  }

  /**
   * Build conversation messages for the AI model
   */
  private buildMessages(session: CoachingSession): OpenAI.Chat.ChatCompletionMessageParam[] {
    const systemPrompt = this.getSystemPrompt(session.coach);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add context if available
    if (session.context) {
      messages.push({
        role: 'system',
        content: `User Context: ${JSON.stringify(session.context, null, 2)}`
      });
    }

    // Add user message
    messages.push({
      role: 'user',
      content: session.message
    });

    return messages;
  }

  /**
   * Get specialized system prompt for each coach type
   */
  private getSystemPrompt(coach: CoachType): string {
    const prompts = {
      master: `You are the Master Coach in Quest Core's AI coaching system. Your role is to orchestrate conversations, understand user needs, and delegate to specialist coaches when appropriate. You have access to the user's complete professional profile including their Trinity (Quest/Service/Pledge), work history, skills, and goals. Provide thoughtful, strategic guidance while identifying when specialist coaches should be involved.`,
      
      career: `You are the Career Coach specialist in Quest Core. You excel at strategic career planning, market analysis, role transitions, and long-term professional development. Help users understand career paths, identify opportunities, and make strategic decisions about their professional journey. Focus on actionable advice based on their skills, experience, and goals.`,
      
      skills: `You are the Skills Coach specialist in Quest Core. You focus on technical skill development, competency building, learning paths, and skill gap analysis. Help users identify skills to develop, create learning plans, and track their technical growth. Provide specific, actionable guidance on skill acquisition and mastery.`,
      
      leadership: `You are the Leadership Coach specialist in Quest Core. You specialize in management skills, interpersonal growth, team dynamics, and executive development. Help users develop leadership capabilities, improve communication, and build effective teams. Focus on practical leadership scenarios and emotional intelligence.`,
      
      network: `You are the Network Coach specialist in Quest Core. You excel at relationship building, networking strategies, professional connections, and industry engagement. Help users build meaningful professional relationships, leverage their network effectively, and expand their professional circle strategically.`
    };
    
    return prompts[coach];
  }

  /**
   * Calculate estimated cost based on model and token usage
   */
  private calculateCost(model: string, tokens: number): number {
    // OpenRouter pricing (approximate, per 1M tokens)
    const pricing: Record<string, number> = {
      'openai/gpt-4-turbo': 0.01,      // $10/1M tokens
      'openai/gpt-4': 0.03,            // $30/1M tokens  
      'openai/gpt-3.5-turbo': 0.002,   // $2/1M tokens
      'anthropic/claude-3-sonnet': 0.003, // $3/1M tokens
      'anthropic/claude-3-haiku': 0.00025, // $0.25/1M tokens
      'google/gemini-pro': 0.0005      // $0.5/1M tokens
    };
    
    const pricePerToken = pricing[model] || 0.01; // Default fallback
    return (tokens * pricePerToken) / 1000000; // Convert to actual cost
  }

  /**
   * Track cost for monitoring and analytics
   */
  private trackCost(userId: string, cost: number): void {
    const currentCost = this.costTracker.get(userId) || 0;
    this.costTracker.set(userId, currentCost + cost);
  }

  /**
   * Get cost tracking data for analytics
   */
  getCostData(userId?: string): Record<string, number> | number {
    if (userId) {
      return this.costTracker.get(userId) || 0;
    }
    return Object.fromEntries(this.costTracker);
  }

  /**
   * Reset cost tracking (e.g., daily reset)
   */
  resetCostTracking(): void {
    this.costTracker.clear();
  }

  /**
   * Test OpenRouter connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.openrouter.chat.completions.create({
        model: 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10
      });
      
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance for use across the application
export const aiClient = new AIClient();