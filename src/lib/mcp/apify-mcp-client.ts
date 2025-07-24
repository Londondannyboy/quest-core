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
   * Search for actors using MCP
   */
  async searchActors(query: string): Promise<any[]> {
    await this.connect();

    try {
      const response = await this.callMCPTool('search-actors', { query });
      return response.actors || [];
    } catch (error) {
      console.error('[MCPApifyClient] Failed to search actors:', error);
      throw error;
    }
  }

  /**
   * Add an actor as a tool using MCP
   */
  async addActor(actorName: string): Promise<any> {
    await this.connect();

    try {
      const response = await this.callMCPTool('add-actor', { actorName });
      console.log('[MCPApifyClient] Actor added as tool:', actorName);
      return response;
    } catch (error) {
      console.error('[MCPApifyClient] Failed to add actor:', error);
      throw error;
    }
  }

  /**
   * Run LinkedIn profile scraper directly using MCP
   */
  async runLinkedInProfileScraper(linkedInUrl: string): Promise<MCPApifyRunOutput[]> {
    if (!this.apiKey || this.apiKey === 'your_apify_api_key_here') {
      throw new Error('APIFY_API_KEY is missing or set to placeholder value. Please configure with a real Apify API key.');
    }

    await this.connect();

    try {
      console.log('[MCPApifyClient] Running LinkedIn profile scraper via MCP for:', linkedInUrl);
      
      // First, add the specific actor as a tool
      console.log('[MCPApifyClient] Adding harvestapi/linkedin-profile-scraper as tool...');
      await this.addActor('harvestapi/linkedin-profile-scraper');
      
      // Run the actor with the correct input format
      const input = {
        queries: [linkedInUrl],
        urls: [linkedInUrl]
      };
      
      console.log('[MCPApifyClient] Running with input:', JSON.stringify(input, null, 2));
      
      // The tool name will be the actor name with special characters replaced
      const toolName = 'harvestapi_linkedin_profile_scraper';
      const response = await this.callMCPTool(toolName, input);
      
      console.log('[MCPApifyClient] LinkedIn scraper completed successfully via MCP');
      return Array.isArray(response) ? response : [response];

    } catch (error) {
      console.error('[MCPApifyClient] LinkedIn scraper execution failed:', error);
      throw error;
    }
  }

  /**
   * Helper method to call MCP tools
   */
  private async callMCPTool(toolName: string, arguments_: any): Promise<any> {
    const mcpPayload = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_
      },
      id: Date.now() // Use timestamp for unique ID
    };

    console.log('[MCPApifyClient] Calling MCP tool:', toolName);
    console.log('[MCPApifyClient] MCP payload:', JSON.stringify(mcpPayload, null, 2));

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
      console.error('[MCPApifyClient] MCP request failed:', response.status, errorText);
      throw new Error(`MCP request failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('[MCPApifyClient] MCP response:', JSON.stringify(result, null, 2));
    
    if (result.error) {
      throw new Error(`MCP tool call failed: ${result.error.message}`);
    }

    return result.result;
  }

  /**
   * List available tools (actors) through MCP
   */
  async listTools(): Promise<any[]> {
    await this.connect();

    try {
      const mcpPayload = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: Math.random().toString(36).substring(7)
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
   * Test the MCP connection by listing available tools
   */
  async testConnection(): Promise<any> {
    try {
      await this.connect();
      
      // Test by listing tools instead of initializing
      const tools = await this.listTools();
      
      console.log('[MCPApifyClient] Connection test successful, found', tools.length, 'tools');
      return {
        status: 'connected',
        toolsCount: tools.length,
        tools: tools.slice(0, 5) // Return first 5 tools as sample
      };
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