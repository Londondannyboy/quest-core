import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get('runId') || 'Wya8FRfqmKcG7I6xO';
    
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }
    
    // Check run status
    const runResponse = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!runResponse.ok) {
      return NextResponse.json({
        error: 'Failed to get run status',
        status: runResponse.status
      }, { status: runResponse.status });
    }
    
    const runData = await runResponse.json();
    const run = runData.data;
    
    // If run is complete, get results
    if (run.status === 'SUCCEEDED') {
      const resultsResponse = await fetch(
        `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );
      
      if (resultsResponse.ok) {
        const results = await resultsResponse.json();
        return NextResponse.json({
          runId,
          status: run.status,
          finishedAt: run.finishedAt,
          results: results.length > 0 ? results[0] : null,
          resultsCount: results.length,
          message: 'Run completed successfully'
        });
      }
    }
    
    return NextResponse.json({
      runId,
      status: run.status,
      startedAt: run.startedAt,
      message: run.status === 'RUNNING' ? 'Still scraping...' : `Run status: ${run.status}`
    });
    
  } catch (error) {
    console.error('[Check Apify Run] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to check run',
      details: String(error)
    }, { status: 500 });
  }
}