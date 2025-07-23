import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { profileScraper } from '@/lib/scrapers/profile-scraper';

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('[Test Profile Only] Starting profile scrape for:', linkedinUrl);
    
    // Test just the profile scraping
    const startTime = Date.now();
    const profile = await profileScraper.scrapeProfile(linkedinUrl);
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      duration,
      profile: {
        name: profile.name,
        headline: profile.headline,
        location: profile.location,
        about: profile.about?.substring(0, 200) + (profile.about && profile.about.length > 200 ? '...' : ''),
        currentPosition: profile.currentPosition,
        experienceCount: profile.experience?.length || 0,
        educationCount: profile.education?.length || 0,
        skillsCount: profile.skills?.length || 0,
        isComplete: profile.isComplete
      },
      message: profile.isComplete ? 'Profile scraped successfully!' : 'Profile scraping failed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test Profile Only] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Profile scraping failed',
      details: String(error)
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Profile-only scraping test endpoint',
    usage: 'POST with { linkedinUrl: "https://www.linkedin.com/in/username" }',
    info: 'This tests only the LinkedIn profile scraping without company enrichment'
  });
}