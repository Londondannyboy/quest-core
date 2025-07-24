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

    // Check if token exists
    const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    if (!token) {
      console.error('No Apify token found in environment variables');
      return NextResponse.json({
        success: false,
        error: 'Apify token not configured'
      }, { status: 500 });
    }

    console.log('Scraping LinkedIn URL:', linkedinUrl);
    console.log('Using Apify token:', token.substring(0, 10) + '...');

    // Initialize client in the function to ensure fresh environment variables
    const client = new ApifyClient({
      token: token,
    });

    // Run the actor - EXACT SAME CODE as working example
    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [linkedinUrl]
    });

    console.log('Apify run started:', run.id);

    // Get results from the run - EXACT SAME CODE as working example
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log('Retrieved items:', items.length);
    
    if (items && items.length > 0) {
      // Format response to match what the admin page expects
      const profile = items[0] as any; // Add 'any' type for now to fix TypeScript
      console.log('Profile data keys:', Object.keys(profile));
      
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
        timestamp: new Date().toISOString(),
        debug: {
          runId: run.id,
          itemCount: items.length,
          profileKeys: Object.keys(profile).slice(0, 10) // First 10 keys for debugging
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'No data found',
        debug: {
          runId: run.id,
          itemsLength: items?.length || 0
        }
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