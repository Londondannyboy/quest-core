import { NextResponse } from 'next/server';

/**
 * Direct test of Apify API without SDK - to isolate the issue
 */
export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No Apify token configured'
      }, { status: 500 });
    }

    // Test 1: Try with actor name
    console.log('Testing with actor name: harvestapi/linkedin-profile-scraper');
    const actorResponse = await fetch('https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries: [linkedinUrl]
      })
    });

    const actorResult = await actorResponse.json();
    console.log('Actor response:', actorResponse.status, actorResult);

    if (!actorResponse.ok) {
      // If actor name fails, try with task ID
      console.log('Actor name failed, trying task ID: LpVuK3Zozwuipa5bp');
      const taskResponse = await fetch('https://api.apify.com/v2/actor-tasks/LpVuK3Zozwuipa5bp/runs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileScraperMode: "Profile details no email ($4 per 1k)",
          queries: [linkedinUrl]
        })
      });

      const taskResult = await taskResponse.json();
      console.log('Task response:', taskResponse.status, taskResult);

      if (!taskResponse.ok) {
        return NextResponse.json({
          success: false,
          error: 'Both actor and task ID failed',
          actorError: actorResult,
          taskError: taskResult
        }, { status: 500 });
      }

      // Task ID worked
      return NextResponse.json({
        success: true,
        method: 'task',
        runId: taskResult.data?.id,
        result: taskResult
      });
    }

    // Actor name worked
    return NextResponse.json({
      success: true,
      method: 'actor',
      runId: actorResult.data?.id,
      result: actorResult
    });

  } catch (error) {
    console.error('Direct API test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Direct API test failed',
      details: String(error)
    }, { status: 500 });
  }
}