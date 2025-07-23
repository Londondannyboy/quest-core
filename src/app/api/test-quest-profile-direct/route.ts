import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    const taskId = 'l4Rzg56H5cbFETmgx'; // quest-profile-scraper
    
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }
    
    console.log(`[Test Quest Profile] Starting direct test of task: ${taskId}`);
    
    // Test the exact endpoint and input format
    const endpoint = `https://api.apify.com/v2/actor-tasks/${taskId}/runs`;
    const input = {
      urls: ['https://www.linkedin.com/in/dankeegan/'],
      queries: ['https://www.linkedin.com/in/dankeegan/']
    };
    
    console.log(`[Test Quest Profile] Endpoint: ${endpoint}`);
    console.log(`[Test Quest Profile] Input:`, JSON.stringify(input, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    const responseText = await response.text();
    console.log(`[Test Quest Profile] Response status: ${response.status}`);
    console.log(`[Test Quest Profile] Response text: ${responseText}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse response',
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500)
      });
    }
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Apify API error',
        status: response.status,
        statusText: response.statusText,
        details: data,
        endpoint,
        input
      });
    }
    
    return NextResponse.json({
      success: true,
      taskId,
      runId: data.data?.id,
      status: data.data?.status,
      message: 'Quest profile scraper started successfully!',
      endpoint,
      input,
      runData: data.data
    });
    
  } catch (error) {
    console.error('[Test Quest Profile] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: String(error)
    }, { status: 500 });
  }
}