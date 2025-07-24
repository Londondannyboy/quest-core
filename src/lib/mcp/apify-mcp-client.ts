/**
 * MCP-based Apify Client for Quest Core
 * Uses official Model Context Protocol SDK to connect to Apify's MCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export interface MCPApifyRunInput {
  [key: string]: any;
}

export interface MCPApifyRunOutput {
  [key: string]: any;
}

export class MCPApifyClient {
  private client: Client | null = null;
  private transport: (StdioClientTransport | SSEClientTransport) | null = null;
  private apiKey: string;
  private isConnected: boolean = false;
  private useHttps: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APIFY_API_KEY || '';
    
    // Use HTTPS in production/serverless environments, stdio locally
    this.useHttps = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    
    if (!this.apiKey || this.apiKey === 'your_apify_api_key_here') {
      console.warn('[MCPApifyClient] API key not found or placeholder. Operations will fail.');
    }
    
    console.log('[MCPApifyClient] Will use', this.useHttps ? 'HTTPS' : 'stdio', 'transport');
  }

  /**
   * Initialize connection to Apify MCP server using proper SDK
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      console.log(`[MCPApifyClient] Connecting to Apify MCP server via ${this.useHttps ? 'HTTPS' : 'stdio'}...`);
      console.log('[MCPApifyClient] Using APIFY_TOKEN:', this.apiKey ? 'SET' : 'MISSING');
      
      // Create MCP client
      this.client = new Client({
        name: "quest-core-client",
        version: "1.0.0"
      }, {
        capabilities: {}
      });

      if (this.useHttps) {
        // For production/Vercel, bypass MCP SDK and use direct HTTP calls
        // since SSE transport with auth headers has compatibility issues
        console.log('[MCPApifyClient] Using direct HTTPS calls to mcp.apify.com (bypassing MCP SDK)');
        this.isConnected = true; // Mark as connected for direct HTTP approach
        console.log('[MCPApifyClient] Successfully configured for direct HTTPS calls');
        return;
      } else {
        // Use stdio transport for local development
        console.log('[MCPApifyClient] Using stdio transport with local MCP server');
        this.transport = new StdioClientTransport({
          command: "npx",
          args: ["@apify/actors-mcp-server"],
          env: {
            ...process.env,
            APIFY_TOKEN: this.apiKey,
            DEBUG: "mcp:*"
          }
        });
      }
      
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
      if (this.useHttps) {
        // Direct HTTP call to MCP server
        const response = await fetch('https://mcp.apify.com', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/list',
            id: Math.random().toString(36).substring(7)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        console.log('[MCPApifyClient] Available tools:', result.result?.tools?.length || 0);
        return result.result?.tools || [];
      } else {
        if (!this.client) {
          throw new Error('MCP client not connected');
        }

        const response = await this.client.listTools();
        console.log('[MCPApifyClient] Available tools:', response.tools?.length || 0);
        return response.tools || [];
      }
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
      console.log('[MCPApifyClient] Calling tool:', toolName);
      console.log('[MCPApifyClient] Arguments:', JSON.stringify(arguments_, null, 2));

      if (this.useHttps) {
        // Direct HTTP call to MCP server
        const response = await fetch('https://mcp.apify.com', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: toolName,
              arguments: arguments_
            },
            id: Math.random().toString(36).substring(7)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(`Tool call failed: ${result.error.message}`);
        }

        console.log('[MCPApifyClient] Tool response received via HTTPS');
        return result.result?.content || result.result;
      } else {
        if (!this.client) {
          throw new Error('MCP client not connected');
        }

        const response = await this.client.callTool({
          name: toolName,
          arguments: arguments_
        });

        console.log('[MCPApifyClient] Tool response received via stdio');
        return response.content;
      }
    } catch (error) {
      console.error('[MCPApifyClient] Tool call failed:', error);
      throw error;
    }
  }

  /**
   * Add an actor as a tool using MCP
   */
  async addActor(actorName: string): Promise<any> {
    await this.connect();

    try {
      console.log('[MCPApifyClient] Adding actor as tool:', actorName);

      if (this.useHttps) {
        // Direct HTTP call to add actor
        const response = await fetch('https://mcp.apify.com', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'addActor',
            params: {
              actorName: actorName
            },
            id: Math.random().toString(36).substring(7)
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(`Add actor failed: ${result.error.message}`);
        }

        console.log('[MCPApifyClient] Actor added as tool via HTTPS:', actorName);
        return result.result;
      } else {
        // Use MCP SDK for local development
        if (!this.client) {
          throw new Error('MCP client not connected');
        }

        // Note: addActor might not be a standard MCP method
        // This is Apify-specific functionality
        console.log('[MCPApifyClient] Actor addition via stdio not implemented');
        return {};
      }
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
      
      // First, try to add the specific LinkedIn actor as a tool
      console.log('[MCPApifyClient] Adding harvestapi/linkedin-profile-scraper as tool...');
      try {
        await this.addActor('harvestapi/linkedin-profile-scraper');
      } catch (addError) {
        console.warn('[MCPApifyClient] Could not add actor as tool:', addError);
        // Continue anyway - tool might already exist
      }
      
      // List available tools to find the LinkedIn scraper
      const tools = await this.listTools();
      console.log('[MCPApifyClient] Available tools:', tools.map(t => t.name));
      
      // Look for LinkedIn profile scraper tool (MCP auto-generates tool names)
      const linkedInTool = tools.find(tool => {
        const name = tool.name.toLowerCase();
        return (name.includes('linkedin') && name.includes('profile')) ||
               name.includes('harvestapi') ||
               name.includes('harvest') ||
               tool.name === 'LpVuK3Zozwuipa5bp'; // Your specific task ID
      });
      
      if (!linkedInTool) {
        console.error('[MCPApifyClient] Available tools:', tools.map(t => t.name));
        throw new Error(`LinkedIn profile scraper tool not found. Available tools: ${tools.map(t => t.name).join(', ')}`);
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
        method: this.useHttps ? 'HTTPS' : 'stdio',
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