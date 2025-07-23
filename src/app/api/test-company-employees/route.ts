import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    const taskId = 'Z4hQMjDxMd5Gk4Cmj'; // Company employees scraper task
    
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }
    
    console.log(`[Test Company Employees] Starting test of task: ${taskId}`);
    
    // Test with a sample company
    const endpoint = `https://api.apify.com/v2/actor-tasks/${taskId}/runs`;
    const input = {
      companies: ['https://www.linkedin.com/company/predeploy/'], // Your company
      searchQuery: '', // Empty to get all employees
      maxItems: 10,
      profileScraperMode: 'Fast'
    };
    
    console.log(`[Test Company Employees] Endpoint: ${endpoint}`);
    console.log(`[Test Company Employees] Input:`, JSON.stringify(input, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    const responseText = await response.text();
    console.log(`[Test Company Employees] Response status: ${response.status}`);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse response',
        status: response.status,
        responseText: responseText.substring(0, 500)
      });
    }
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Apify API error',
        status: response.status,
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
      message: 'Company employees scraper started successfully!',
      endpoint,
      input,
      runData: data.data,
      checkResultsUrl: `/api/check-apify-run?runId=${data.data?.id}`
    });
    
  } catch (error) {
    console.error('[Test Company Employees] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: String(error)
    }, { status: 500 });
  }
}