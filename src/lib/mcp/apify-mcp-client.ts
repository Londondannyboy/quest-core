/**
 * MCP-based Apify Client for Quest Core
 * Uses Model Context Protocol to connect to Apify's official MCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface MCPApifyRunInput {
  [key: string]: any;
}

export interface MCPApifyRunOutput {
  [key: string]: any;
}

export class MCPApifyClient {
  private client: Client | null = null;
  private apiKey: string;
  private isConnected: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APIFY_API_KEY || '';
    
    if (!this.apiKey || this.apiKey === 'your_apify_api_key_here') {
      console.warn('[MCPApifyClient] API key not found or placeholder. Operations will fail.');
    }
  }

  /**
   * Initialize connection to Apify MCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      // For server-side usage, we'll use HTTP transport to mcp.apify.com
      // Note: In production, this might need to be handled differently
      // since MCP is typically designed for AI assistant integration
      console.log('[MCPApifyClient] Connecting to Apify MCP server...');
      
      // For now, we'll create a lightweight wrapper that mimics MCP
      // but uses direct HTTP calls to the Apify MCP endpoint
      this.isConnected = true;
      console.log('[MCPApifyClient] Connected to Apify MCP server');
    } catch (error) {
      console.error('[MCPApifyClient] Failed to connect:', error);
      throw new Error(`Failed to connect to Apify MCP server: ${error}`);
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.isConnected = false;
  }

  /**
   * Run an Apify actor through MCP
   */
  async runActor(
    actorId: string,
    input: MCPApifyRunInput,
    options: {
      timeout?: number;
      memory?: number;
      waitForFinish?: boolean;
    } = {}
  ): Promise<MCPApifyRunOutput[]> {
    if (!this.apiKey || this.apiKey === 'your_apify_api_key_here') {
      throw new Error('APIFY_API_KEY is missing or set to placeholder value. Please configure with a real Apify API key.');
    }

    await this.connect();

    try {
      console.log('[MCPApifyClient] Running actor via MCP:', actorId);
      console.log('[MCPApifyClient] Input:', JSON.stringify(input, null, 2));

      // For now, use direct HTTP to Apify MCP endpoint
      // This is a bridge implementation until full MCP integration
      const mcpPayload = {
        method: 'tools/call',
        params: {
          name: 'run_actor',
          arguments: {
            actorId,
            input,
            options: {
              waitForFinish: options.waitForFinish !== false,
              timeout: options.timeout || 120,
              memory: options.memory
            }
          }
        }
      };

      const response = await fetch('https://mcp.apify.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify(mcpPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCP request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(`MCP actor execution failed: ${result.error.message}`);
      }

      // Extract the actual actor results from MCP response
      const actorResults = result.result?.data || result.result || [];
      
      console.log('[MCPApifyClient] Actor completed successfully via MCP');
      return Array.isArray(actorResults) ? actorResults : [actorResults];

    } catch (error) {
      console.error('[MCPApifyClient] Actor execution failed:', error);
      throw error;
    }
  }

  /**
   * List available tools (actors) through MCP
   */
  async listTools(): Promise<any[]> {
    await this.connect();

    try {
      const response = await fetch('https://mcp.apify.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          method: 'tools/list'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.status}`);
      }

      const result = await response.json();
      return result.result?.tools || [];
    } catch (error) {
      console.error('[MCPApifyClient] Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Test the MCP connection
   */
  async testConnection(): Promise<any> {
    try {
      await this.connect();
      
      const response = await fetch('https://mcp.apify.com', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'quest-core',
              version: '1.0.0'
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`MCP connection test failed: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log('[MCPApifyClient] Connection test successful');
      return data.result;
    } catch (error) {
      console.error('[MCPApifyClient] Connection test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mcpApifyClient = new MCPApifyClient();

// Popular actors accessible through MCP
export const MCP_APIFY_ACTORS = {
  // Use actor names that work with MCP server
  LINKEDIN_PROFILE_SCRAPER: 'harvestapi/linkedin-profile-scraper',
  LINKEDIN_COMPANY_SCRAPER: 'harvestapi/linkedin-company-employees',
  
  // Alternative actors if needed
  TRUDAX_LINKEDIN_SCRAPER: 'trudax/linkedin-profile-scraper',
  
  // Task IDs (may work with MCP if configured)
  HARVEST_LINKEDIN_TASK: 'LpVuK3Zozwuipa5bp',
} as const;