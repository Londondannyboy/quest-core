import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required' 
      }, { status: 400 });
    }

    const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Apify token not configured'
      }, { status: 500 });
    }

    console.log('Scraping LinkedIn URL:', linkedinUrl);

    // Initialize client
    const client = new ApifyClient({ token });

    // Run the actor
    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [linkedinUrl]
    });

    console.log('Apify run completed:', run.id);

    // Get results from the run
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items && items.length > 0) {
      // THE FIX: Profile data is in items[0].element, not items[0]
      const item = items[0] as any;
      const profile = item.element || item;
      
      console.log('Profile data found:', {
        name: profile.firstName + ' ' + profile.lastName,
        location: profile.location?.linkedinText
      });
      
      return NextResponse.json({
        success: true,
        testMode: true,
        enrichedData: {
          profile: {
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.name || '',
            headline: profile.headline || '',
            location: profile.location?.linkedinText || profile.location || '',
            skillsCount: Array.isArray(profile.skills) ? profile.skills.length : 0,
            experienceCount: Array.isArray(profile.experience) ? profile.experience.length : 0,
            educationCount: Array.isArray(profile.education) ? profile.education.length : 0,
            isComplete: true
          },
          companies: [],
          insights: {
            totalExperience: Array.isArray(profile.experience) ? profile.experience.length : 0,
            companiesWorked: Array.isArray(profile.experience) ? profile.experience.length : 0,
            topSkills: Array.isArray(profile.skills) 
              ? profile.skills.slice(0, 5).map((s: any) => typeof s === 'string' ? s : s.name || s.skill || '') 
              : []
          }
        },
        totalTime: 0,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No data found' 
      });
    }
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile',
      details: String(error)
    }, { status: 500 });
  }
}