import { NextResponse } from 'next/server';

/**
 * TEMPORARY SOLUTION: Use the working apify-mp-mcp-server deployment
 * until we figure out why the same code doesn't work in Quest Core
 */
export async function POST(request: Request) {
  try {
    const { linkedinUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required' 
      }, { status: 400 });
    }

    // Use your working Apify MCP server deployment
    const apifyServerUrl = process.env.APIFY_EXTERNAL_URL || 'https://apify-mp-mcp-server.vercel.app';
    
    console.log('Using external Apify server:', apifyServerUrl);
    
    const response = await fetch(`${apifyServerUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ linkedinUrl })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      return NextResponse.json({
        success: false,
        error: data.error || 'External scraper failed'
      }, { status: 500 });
    }

    // Format response to match what the admin page expects
    const profile = data.data;
    
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
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Proxy scraping error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile',
      details: String(error)
    }, { status: 500 });
  }
}