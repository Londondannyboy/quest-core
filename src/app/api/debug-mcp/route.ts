import { NextResponse } from 'next/server';
import { mcpApifyClient } from '@/lib/mcp/apify-mcp-client';

export async function GET() {
  try {
    console.log('[Debug MCP] Testing MCP Apify connection...');
    
    // Test MCP connection
    const connectionTest = await mcpApifyClient.testConnection();
    
    console.log('[Debug MCP] Connection test result:', connectionTest);
    
    // List available tools
    let tools = [];
    try {
      tools = await mcpApifyClient.listTools();
      console.log('[Debug MCP] Available tools:', tools.length);
    } catch (toolsError) {
      console.warn('[Debug MCP] Could not list tools:', toolsError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'MCP Apify connection successful',
      connectionTest,
      availableTools: tools,
      toolsCount: tools.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug MCP] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({
        error: 'LinkedIn URL is required'
      }, { status: 400 });
    }

    console.log('[Debug MCP] Testing LinkedIn scraping via MCP:', linkedinUrl);
    
    // Test LinkedIn profile scraper
    const result = await mcpApifyClient.runLinkedInProfileScraper(linkedinUrl);
    
    return NextResponse.json({
      success: true,
      message: 'MCP LinkedIn scraper execution successful',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug MCP] POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}