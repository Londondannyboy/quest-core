/**
 * MCP-based Apify Client for Quest Core
 * Uses official Model Context Protocol SDK to connect to Apify's MCP server
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
  private transport: StdioClientTransport | null = null;
  private apiKey: string;
  private isConnected: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APIFY_API_KEY || '';
    
    if (!this.apiKey || this.apiKey === 'your_apify_api_key_here') {
      console.warn('[MCPApifyClient] API key not found or placeholder. Operations will fail.');
    }
  }

  /**
   * Initialize connection to Apify MCP server using proper SDK
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      console.log('[MCPApifyClient] Connecting to Apify MCP server via stdio...');
      
      // Create MCP client
      this.client = new Client({
        name: "quest-core-client",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      // Create stdio transport to run the Apify MCP server locally
      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["@apify/actors-mcp-server"],
        env: {
          ...process.env,
          APIFY_TOKEN: this.apiKey
        }
      });

      // Connect to the MCP server
      await this.client.connect(this.transport);
      this.isConnected = true;
      
      console.log('[MCPApifyClient] Successfully connected to Apify MCP server');
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
    if (this.transport) {
      this.transport = null;
    }
    this.isConnected = false;
  }

  /**
   * List available tools (actors) through MCP
   */
  async listTools(): Promise<any[]> {
    await this.connect();

    try {
      if (!this.client) {
        throw new Error('MCP client not connected');
      }

      const response = await this.client.listTools();
      console.log('[MCPApifyClient] Available tools:', response.tools?.length || 0);
      return response.tools || [];
    } catch (error) {
      console.error('[MCPApifyClient] Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Call a tool (actor) through MCP
   */
  async callTool(toolName: string, arguments_: any): Promise<any> {
    await this.connect();

    try {
      if (!this.client) {
        throw new Error('MCP client not connected');
      }

      console.log('[MCPApifyClient] Calling tool:', toolName);
      console.log('[MCPApifyClient] Arguments:', JSON.stringify(arguments_, null, 2));

      const response = await this.client.callTool({
        name: toolName,
        arguments: arguments_
      });

      console.log('[MCPApifyClient] Tool response received');
      return response.content;
    } catch (error) {
      console.error('[MCPApifyClient] Tool call failed:', error);
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
      
      // List available tools to find the LinkedIn scraper
      const tools = await this.listTools();
      console.log('[MCPApifyClient] Available tools:', tools.map(t => t.name));
      
      // Look for LinkedIn profile scraper tool (MCP auto-generates tool names)
      const linkedInTool = tools.find(tool => 
        tool.name.includes('linkedin') && 
        tool.name.includes('profile') ||
        tool.name.includes('harvestapi')
      );
      
      if (!linkedInTool) {
        throw new Error('LinkedIn profile scraper tool not found in MCP server');
      }
      
      console.log('[MCPApifyClient] Using tool:', linkedInTool.name);
      
      // Run the LinkedIn scraper with correct input format
      const input = {
        queries: [linkedInUrl],
        urls: [linkedInUrl]
      };
      
      console.log('[MCPApifyClient] Running with input:', JSON.stringify(input, null, 2));
      
      const response = await this.callTool(linkedInTool.name, input);
      
      console.log('[MCPApifyClient] LinkedIn scraper completed successfully via MCP');
      return Array.isArray(response) ? response : [response];

    } catch (error) {
      console.error('[MCPApifyClient] LinkedIn scraper execution failed:', error);
      throw error;
    }
  }

  /**
   * Test the MCP connection by listing available tools
   */
  async testConnection(): Promise<any> {
    try {
      await this.connect();
      
      // Test by listing tools
      const tools = await this.listTools();
      
      console.log('[MCPApifyClient] Connection test successful, found', tools.length, 'tools');
      return {
        status: 'connected',
        toolsCount: tools.length,
        tools: tools.slice(0, 5).map(t => ({ name: t.name, description: t.description }))
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