import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test Apify client initialization
    const hasApiKey = !!process.env.APIFY_API_KEY;
    const hasUserId = !!process.env.APIFY_USER_ID;
    
    if (!hasApiKey) {
      return NextResponse.json({
        error: 'APIFY_API_KEY not found in environment variables',
        hasApiKey,
        hasUserId
      }, { status: 500 });
    }

    // Try to import and test the Apify client
    const { apifyClient } = await import('@/lib/scrapers/apify-client');
    
    // Test a simple API call to Apify - get user info
    const response = await fetch('https://api.apify.com/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${process.env.APIFY_API_KEY}`,
      },
    });

    const userData = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({
        error: 'Apify API authentication failed',
        status: response.status,
        data: userData,
        hasApiKey,
        hasUserId
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Apify client initialized successfully',
      hasApiKey,
      hasUserId,
      userInfo: {
        id: userData.data?.id,
        username: userData.data?.username,
        email: userData.data?.email
      },
      apiKeyPrefix: process.env.APIFY_API_KEY?.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Debug Apify] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}