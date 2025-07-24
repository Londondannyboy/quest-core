import { NextResponse } from 'next/server';
import { simpleApifyScraper } from '@/lib/scrapers/simple-apify-scraper';

/**
 * Test endpoint using the simplified Apify scraper with official SDK
 * Based on the working implementation from apify-mp-mcp-server
 */
export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required',
        success: false 
      }, { status: 400 });
    }
    
    console.log('[Test Simple Apify] Starting profile scrape for:', linkedinUrl);
    
    // Use the simplified scraper with official SDK
    const startTime = Date.now();
    const profileData = await simpleApifyScraper.scrapeLinkedInProfile(linkedinUrl);
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: profileData,
      profile: {
        name: profileData.name,
        headline: profileData.headline,
        location: profileData.location,
        skillsCount: profileData.skills?.length || 0,
        experienceCount: profileData.experience?.length || 0,
        educationCount: profileData.education?.length || 0,
      },
      duration,
      timestamp: new Date().toISOString(),
      note: 'Using official Apify SDK (same as working example)'
    });
    
  } catch (error) {
    console.error('[Test Simple Apify] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Profile scraping failed',
      details: String(error)
    }, { status: 500 });
  }
}