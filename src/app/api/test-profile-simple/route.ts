import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

// Initialize Apify client EXACTLY like the working example
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required' 
      }, { status: 400 });
    }

    console.log('Scraping LinkedIn URL:', linkedinUrl);

    // Run the actor - EXACT SAME CODE as working example
    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [linkedinUrl]
    });

    // Get results from the run - EXACT SAME CODE as working example
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items && items.length > 0) {
      // Format response to match what the admin page expects
      const profile = items[0] as any; // Add 'any' type for now to fix TypeScript
      return NextResponse.json({
        success: true,
        testMode: true,
        enrichedData: {
          profile: {
            name: profile.name || '',
            headline: profile.headline || '',
            location: profile.location || '',
            skillsCount: profile.skills?.length || 0,
            experienceCount: profile.experience?.length || 0,
            educationCount: profile.education?.length || 0,
            isComplete: true
          },
          companies: [],
          insights: {
            totalExperience: profile.experience?.length || 0,
            companiesWorked: profile.experience?.length || 0,
            topSkills: profile.skills?.slice(0, 5).map((s: any) => s.name) || []
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
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile'
    }, { status: 500 });
  }
}