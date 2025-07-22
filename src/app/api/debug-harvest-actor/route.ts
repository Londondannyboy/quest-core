import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    const actorId = 'M2FMdjRVeF1HPGFcc';
    
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }
    
    // Try different endpoint formats
    const tests = [
      {
        name: 'Actor endpoint',
        url: `https://api.apify.com/v2/acts/${actorId}`,
        method: 'GET'
      },
      {
        name: 'Actor task endpoint',
        url: `https://api.apify.com/v2/actor-tasks/${actorId}`,
        method: 'GET'
      },
      {
        name: 'User actor endpoint',
        url: `https://api.apify.com/v2/acts/infrastructure_quest~${actorId}`,
        method: 'GET'
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
        
        results.push({
          test: test.name,
          url: test.url,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          data: response.ok ? data : text.substring(0, 200)
        });
      } catch (error) {
        results.push({
          test: test.name,
          url: test.url,
          error: String(error)
        });
      }
    }
    
    return NextResponse.json({
      actorId,
      tests: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      details: String(error)
    }, { status: 500 });
  }
}