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
    
    // Check if API keys are available
    if (!process.env.SCRAPFLY_API_KEY || !process.env.HARVEST_API_KEY) {
      return NextResponse.json({
        error: 'Scraping services not configured',
        details: 'Missing required API keys for Scrapfly or Harvest services',
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
    const hasScrapflyKey = !!process.env.SCRAPFLY_API_KEY;
    const hasHarvestKey = !!process.env.HARVEST_API_KEY;
    
    // Basic status response without requiring any external dependencies
    return NextResponse.json({
      status: 'Scraping Infrastructure Status',
      environment: {
        scrapflyConfigured: hasScrapflyKey,
        harvestConfigured: hasHarvestKey,
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
      notes: !hasScrapflyKey || !hasHarvestKey ? 
        'Some API keys missing - scraping functionality may be limited' : 
        'All systems operational',
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