/**
 * Apify MCP Client for Quest Core
 * Official implementation following Apify MCP Server documentation
 * https://docs.apify.com/platform/integrations/mcp
 */

export interface MCPApifyRunInput {
  [key: string]: any;
}

export interface MCPApifyRunOutput {
  [key: string]: any;
}

export class MCPApifyClient {
  private apiToken: string;
  private baseUrl = 'https://mcp.apify.com';
  private requestId = 0;

  constructor(apiToken?: string) {
    // Use APIFY_TOKEN as per official docs
    this.apiToken = apiToken || process.env.APIFY_TOKEN || process.env.APIFY_API_KEY || '';
    
    if (!this.apiToken || this.apiToken === 'your_apify_api_key_here') {
      console.warn('[MCPApifyClient] APIFY_TOKEN not found or placeholder. Get it from Apify Console > Integrations');
    } else {
      console.log('[MCPApifyClient] Initialized with official Apify MCP server');
    }
  }

  private getNextId(): string {
    return `mcp-${++this.requestId}`;
  }

  private async makeRequest(method: string, params?: any): Promise<any> {
    const requestBody = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method,
      ...(params && { params })
    };

    console.log('[MCPApifyClient] Making request:', method, params);

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`MCP error: ${result.error.message} (code: ${result.error.code})`);
    }

    return result.result;
  }

  /**
   * Initialize MCP session (called automatically when needed)
   */
  async initialize(): Promise<void> {
    try {
      // Initialize the MCP session
      const result = await this.makeRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'quest-core',
          version: '1.0.0'
        }
      });
      
      console.log('[MCPApifyClient] MCP session initialized:', result);
    } catch (error) {
      console.error('[MCPApifyClient] Failed to initialize MCP session:', error);
      throw error;
    }
  }

  /**
   * List available tools (actors) through MCP
   */
  async listTools(): Promise<any[]> {
    try {
      const result = await this.makeRequest('tools/list');
      const tools = result.tools || [];
      console.log('[MCPApifyClient] Available tools:', tools.length);
      return tools;
    } catch (error) {
      console.error('[MCPApifyClient] Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Call a tool (actor) through MCP
   */
  async callTool(toolName: string, arguments_: any): Promise<any> {
    try {
      console.log('[MCPApifyClient] Calling tool:', toolName);
      console.log('[MCPApifyClient] Arguments:', JSON.stringify(arguments_, null, 2));

      const result = await this.makeRequest('tools/call', {
        name: toolName,
        arguments: arguments_
      });

      console.log('[MCPApifyClient] Tool response received successfully');
      return result.content || result;
    } catch (error) {
      console.error('[MCPApifyClient] Tool call failed:', error);
      throw error;
    }
  }

  /**
   * Add an actor as a tool using MCP
   */
  async addActor(actorName: string): Promise<any> {
    try {
      console.log('[MCPApifyClient] Adding actor as tool:', actorName);

      // Note: This method may not be standard MCP - checking if it exists
      const result = await this.makeRequest('addActor', {
        actorName: actorName
      });

      console.log('[MCPApifyClient] Actor added as tool:', actorName);
      return result;
    } catch (error) {
      console.warn('[MCPApifyClient] Could not add actor (may not be supported by server):', error);
      // Don't throw - this is optional functionality
      return null;
    }
  }

  /**
   * Run LinkedIn profile scraper directly using MCP
   */
  async runLinkedInProfileScraper(linkedInUrl: string): Promise<MCPApifyRunOutput[]> {
    if (!this.apiToken || this.apiToken === 'your_apify_api_key_here') {
      throw new Error('APIFY_TOKEN is missing. Please configure with a valid Apify API token.');
    }

    try {
      console.log('[MCPApifyClient] Running LinkedIn profile scraper via MCP for:', linkedInUrl);
      
      // First, try to add the specific LinkedIn actor as a tool
      console.log('[MCPApifyClient] Adding harvestapi/linkedin-profile-scraper as tool...');
      await this.addActor('harvestapi/linkedin-profile-scraper');
      
      // List available tools to find the LinkedIn scraper
      const tools = await this.listTools();
      console.log('[MCPApifyClient] Available tools:', tools.map(t => t.name || t.id));
      
      // Look for LinkedIn profile scraper tool
      const linkedInTool = tools.find(tool => {
        const name = (tool.name || tool.id || '').toLowerCase();
        return (name.includes('linkedin') && name.includes('profile')) ||
               name.includes('harvestapi') ||
               name.includes('harvest') ||
               tool.name === 'LpVuK3Zozwuipa5bp' || // Your specific task ID
               name === 'harvestapi/linkedin-profile-scraper';
      });
      
      if (!linkedInTool) {
        // If not found, try using the task ID directly as tool name
        console.log('[MCPApifyClient] LinkedIn tool not found in list, trying direct task ID...');
        const taskId = 'LpVuK3Zozwuipa5bp';
        const input = {
          queries: [linkedInUrl],
          urls: [linkedInUrl]
        };
        
        const response = await this.callTool(taskId, input);
        return Array.isArray(response) ? response : [response];
      }
      
      console.log('[MCPApifyClient] Using tool:', linkedInTool.name || linkedInTool.id);
      
      // Run the LinkedIn scraper with correct input format
      const input = {
        queries: [linkedInUrl],
        urls: [linkedInUrl]
      };
      
      console.log('[MCPApifyClient] Running with input:', JSON.stringify(input, null, 2));
      
      const response = await this.callTool(linkedInTool.name || linkedInTool.id, input);
      
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
      // Test by listing tools
      const tools = await this.listTools();
      
      console.log('[MCPApifyClient] Connection test successful, found', tools.length, 'tools');
      return {
        status: 'connected',
        method: 'HTTPS',
        endpoint: this.baseUrl,
        toolsCount: tools.length,
        tools: tools.slice(0, 5).map(t => ({ 
          name: t.name || t.id, 
          description: t.description 
        }))
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