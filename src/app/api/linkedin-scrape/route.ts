import { NextResponse } from 'next/server';

/**
 * LinkedIn scraping endpoint that can use multiple methods:
 * 1. External Apify MCP server (if APIFY_EXTERNAL_URL is set)
 * 2. Local Apify server (if running on port 3001)
 * 3. Direct Apify call (fallback)
 */
export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required' 
      }, { status: 400 });
    }

    // Method 1: Try external Apify MCP server (your working deployment)
    const externalUrl = process.env.APIFY_EXTERNAL_URL || 'https://apify-mp-mcp-server.vercel.app';
    try {
      console.log('Trying external Apify server:', externalUrl);
      const response = await fetch(`${externalUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('External server succeeded');
        return NextResponse.json(data);
      }
    } catch (e) {
      console.log('External server failed:', e);
    }

    // Method 2: Try local Apify server
    try {
      console.log('Trying local Apify server on port 3001');
      const response = await fetch('http://localhost:3001/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedinUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Local server succeeded');
        return NextResponse.json(data);
      }
    } catch (e) {
      console.log('Local server failed:', e);
    }

    // Method 3: Direct call (this hasn't been working)
    console.log('Falling back to direct Apify call');
    const { ApifyClient } = await import('apify-client');
    const client = new ApifyClient({
      token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
    });

    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [linkedinUrl]
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items && items.length > 0) {
      return NextResponse.json({ success: true, data: items[0] });
    } else {
      return NextResponse.json({ success: false, error: 'No data found' });
    }
    
  } catch (error) {
    console.error('All methods failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile'
    }, { status: 500 });
  }
}