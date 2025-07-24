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

    try {
      // Run the actor - EXACT SAME CODE as working example
      console.log('Starting actor run...');
      const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries: [linkedinUrl]
      });

      console.log('Apify run completed:', {
        id: run.id,
        status: run.status,
        exitCode: run.exitCode,
        defaultDatasetId: run.defaultDatasetId
      });

      // Check if run was successful
      if (run.status !== 'SUCCEEDED') {
        console.error('Run failed with status:', run.status);
        return NextResponse.json({
          success: false,
          error: `Apify run failed with status: ${run.status}`,
          debug: {
            runId: run.id,
            status: run.status,
            exitCode: run.exitCode
          }
        }, { status: 500 });
      }

      // Get results from the run - EXACT SAME CODE as working example
      console.log('Fetching dataset items...');
      const { items } = await client.dataset(run.defaultDatasetId).listItems();
      
      console.log('Retrieved items:', items.length);
      console.log('First item:', JSON.stringify(items[0], null, 2).substring(0, 500));
      
      if (items && items.length > 0) {
        // Format response to match what the admin page expects
        const profile = items[0] as any;
        console.log('Profile data keys:', Object.keys(profile));
        
        // Check if we got an error response from the scraper
        if (profile.error || profile.errorMessage) {
          console.error('Scraper returned error:', profile.error || profile.errorMessage);
          return NextResponse.json({
            success: false,
            error: profile.error || profile.errorMessage || 'Scraper returned an error',
            debug: {
              runId: run.id,
              profileData: profile
            }
          }, { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          testMode: true,
          enrichedData: {
            profile: {
              name: profile.name || profile.fullName || '',
              headline: profile.headline || profile.title || '',
              location: profile.location || '',
              skillsCount: (profile.skills && Array.isArray(profile.skills)) ? profile.skills.length : 0,
              experienceCount: (profile.experience && Array.isArray(profile.experience)) ? profile.experience.length : 0,
              educationCount: (profile.education && Array.isArray(profile.education)) ? profile.education.length : 0,
              isComplete: true
            },
            companies: [],
            insights: {
              totalExperience: (profile.experience && Array.isArray(profile.experience)) ? profile.experience.length : 0,
              companiesWorked: (profile.experience && Array.isArray(profile.experience)) ? profile.experience.length : 0,
              topSkills: (profile.skills && Array.isArray(profile.skills)) 
                ? profile.skills.slice(0, 5).map((s: any) => typeof s === 'string' ? s : s.name || s.skill || '') 
                : []
            }
          },
          totalTime: 0,
          timestamp: new Date().toISOString(),
          debug: {
            runId: run.id,
            runStatus: run.status,
            itemCount: items.length,
            profileKeys: Object.keys(profile).slice(0, 20), // More keys for debugging
            sampleData: JSON.stringify(profile).substring(0, 200) // Sample of actual data
          }
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'No data found',
          debug: {
            runId: run.id,
            runStatus: run.status,
            itemsLength: items?.length || 0,
            items: items
          }
        });
      }
    } catch (apifyError: any) {
      console.error('Apify API error:', apifyError);
      console.error('Error details:', {
        message: apifyError.message,
        statusCode: apifyError.statusCode,
        type: apifyError.type,
        clientMethod: apifyError.clientMethod
      });
      
      // Check for specific error types
      if (apifyError.message?.includes('token') || apifyError.statusCode === 401) {
        return NextResponse.json({
          success: false,
          error: 'Authentication failed. Please check Apify token.',
          details: apifyError.message
        }, { status: 401 });
      }
      
      throw apifyError; // Re-throw to be caught by outer catch
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