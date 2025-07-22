import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { linkedinUrl, email, testMode } = await request.json();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('[Test Scraping] Starting enrichment test for:', userId);
    
    // Check if Apify API key is available
    if (!process.env.APIFY_API_KEY) {
      return NextResponse.json({
        error: 'Scraping services not configured',
        details: 'Missing APIFY_API_KEY environment variable',
        testMode,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    // Dynamically import the enrichment pipeline to avoid initialization issues
    const { enrichmentPipeline } = await import('@/lib/scrapers');
    
    // Test the enrichment pipeline
    const startTime = Date.now();
    const enrichedData = await enrichmentPipeline.enrichUserProfile(
      userId,
      linkedinUrl,
      email
    );
    const totalTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      testMode,
      enrichedData: {
        profile: {
          name: enrichedData.profile.name,
          headline: enrichedData.profile.headline,
          location: enrichedData.profile.location,
          skillsCount: enrichedData.profile.skills?.length || 0,
          experienceCount: enrichedData.profile.experience?.length || 0,
          educationCount: enrichedData.profile.education?.length || 0,
          isComplete: enrichedData.profile.isComplete
        },
        companies: enrichedData.companies.map(company => ({
          name: company.name,
          domain: company.domain,
          industry: company.industry,
          size: company.size?.range,
          confidence: company.confidence
        })),
        insights: enrichedData.insights,
        metadata: {
          enrichmentDuration: enrichedData.enrichmentDuration,
          dataCompleteness: enrichedData.dataCompleteness,
          sources: enrichedData.sources
        }
      },
      totalTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test Scraping] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Scraping test failed',
      details: String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Check environment variables safely
    const hasApifyKey = !!process.env.APIFY_API_KEY;
    const hasApifyUserId = !!process.env.APIFY_USER_ID;
    
    // Debug Apify connection
    let apifyDebug = {};
    if (hasApifyKey) {
      try {
        const response = await fetch('https://api.apify.com/v2/users/me', {
          headers: {
            'Authorization': `Bearer ${process.env.APIFY_API_KEY}`,
          },
        });
        const userData = await response.json();
        
        apifyDebug = {
          apiWorking: response.ok,
          status: response.status,
          userInfo: response.ok ? {
            id: userData.data?.id,
            username: userData.data?.username
          } : null,
          error: !response.ok ? userData : null
        };
      } catch (error) {
        apifyDebug = {
          apiWorking: false,
          error: String(error)
        };
      }
    }
    
    // Basic status response without requiring any external dependencies
    return NextResponse.json({
      status: 'Scraping Infrastructure Status (Apify)',
      environment: {
        apifyConfigured: hasApifyKey,
        apifyUserIdConfigured: hasApifyUserId,
        rateLimiting: true,
        cacheEnabled: true,
        production: process.env.NODE_ENV === 'production',
        vercel: !!process.env.VERCEL
      },
      endpoints: {
        profileScraping: 'POST /api/test-scraping with linkedinUrl',
        companyScraping: 'Included in enrichment pipeline',
        fullEnrichment: 'POST with userId, linkedinUrl, email'
      },
      example: {
        linkedinUrl: 'https://www.linkedin.com/in/username',
        email: 'user@company.com'
      },
      apifyActors: {
        linkedinProfile: 'apify/linkedin-profile-scraper',
        linkedinCompany: 'apify/linkedin-company-scraper',
        webScraper: 'apify/web-scraper'
      },
      notes: !hasApifyKey ? 
        'APIFY_API_KEY missing - scraping functionality disabled' : 
        'Apify integration ready - all systems operational',
      apifyDebug,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test Scraping GET] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}