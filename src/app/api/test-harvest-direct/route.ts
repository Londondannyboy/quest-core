import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    const taskId = 'M2FMdjRVeF1HPGFcc';
    
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }
    
    // Test direct task run
    const runResponse = await fetch(`https://api.apify.com/v2/actor-tasks/${taskId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          profileUrls: ['https://www.linkedin.com/in/dankeegan/'],
          includeExperience: true,
          includeEducation: true,
          includeSkills: true
        }
      }),
    });
    
    const responseText = await runResponse.text();
    let runData;
    try {
      runData = JSON.parse(responseText);
    } catch {
      return NextResponse.json({
        error: 'Failed to parse response',
        status: runResponse.status,
        statusText: runResponse.statusText,
        response: responseText.substring(0, 500)
      }, { status: 500 });
    }
    
    if (!runResponse.ok) {
      return NextResponse.json({
        error: 'Failed to start task',
        status: runResponse.status,
        statusText: runResponse.statusText,
        details: runData
      }, { status: runResponse.status });
    }
    
    return NextResponse.json({
      success: true,
      taskId,
      runId: runData.data?.id,
      status: runData.data?.status,
      message: 'Task started successfully - check Apify dashboard for results',
      runData: runData.data
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      details: String(error)
    }, { status: 500 });
  }
}