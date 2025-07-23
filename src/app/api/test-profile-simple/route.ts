import { NextResponse } from 'next/server';
import { profileScraper } from '@/lib/scrapers/profile-scraper';

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required',
        success: false 
      }, { status: 400 });
    }
    
    console.log('[Test Profile Simple] Starting profile scrape for:', linkedinUrl);
    
    // Direct profile scraping without auth or enrichment
    const startTime = Date.now();
    const profile = await profileScraper.scrapeProfile(linkedinUrl);
    const duration = Date.now() - startTime;
    
    if (!profile.isComplete) {
      return NextResponse.json({
        success: false,
        error: 'Profile scraping failed',
        profile: {
          name: profile.name,
          error: profile.name.startsWith('Error:') ? profile.name : 'Unknown error'
        },
        duration
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      testMode: true,
      enrichedData: {
        profile: {
          name: profile.name,
          headline: profile.headline,
          location: profile.location,
          skillsCount: profile.skills?.length || 0,
          experienceCount: profile.experience?.length || 0,
          educationCount: profile.education?.length || 0,
          isComplete: profile.isComplete
        },
        companies: [], // Empty for now
        insights: {
          totalExperience: profile.experience?.length || 0,
          companiesWorked: profile.experience?.length || 0,
          topSkills: profile.skills?.slice(0, 5).map(s => s.name) || []
        }
      },
      totalTime: duration,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Test Profile Simple] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Profile scraping failed',
      details: String(error)
    }, { status: 500 });
  }
}