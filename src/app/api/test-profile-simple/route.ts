import { NextResponse } from 'next/server';

/**
 * Debug version to see what's actually happening
 */
export async function POST(request: Request) {
  const debugInfo: any = {
    steps: [],
    errors: []
  };

  try {
    const { linkedinUrl } = await request.json();
    debugInfo.steps.push('1. Received LinkedIn URL: ' + linkedinUrl);
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required' 
      }, { status: 400 });
    }

    // Try the proxy first
    const apifyServerUrl = 'https://apify-mp-mcp-server.vercel.app';
    debugInfo.steps.push('2. Calling external server: ' + apifyServerUrl);
    
    try {
      const response = await fetch(`${apifyServerUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ linkedinUrl })
      });

      debugInfo.steps.push(`3. Response status: ${response.status}`);
      const responseText = await response.text();
      debugInfo.steps.push(`4. Response text (first 200 chars): ${responseText.substring(0, 200)}`);
      
      let data;
      try {
        data = JSON.parse(responseText);
        debugInfo.steps.push('5. Successfully parsed JSON');
        debugInfo.steps.push(`6. Data keys: ${Object.keys(data).join(', ')}`);
        if (data.data) {
          debugInfo.steps.push(`7. Profile data keys: ${Object.keys(data.data).slice(0, 10).join(', ')}`);
        }
      } catch (parseError) {
        debugInfo.errors.push('JSON parse error: ' + parseError);
        throw new Error('Failed to parse response');
      }
      
      if (!response.ok || !data.success) {
        debugInfo.errors.push('Response not ok or not success');
        throw new Error(data.error || 'External scraper failed');
      }

      // Check if we actually got profile data
      const profile = data.data;
      if (!profile) {
        debugInfo.errors.push('No profile data in response');
        throw new Error('No profile data received');
      }

      debugInfo.steps.push(`8. Profile name: ${profile.name || 'MISSING'}`);
      debugInfo.steps.push(`9. Profile has skills: ${!!profile.skills}`);
      
      // Return the full debug info along with the formatted response
      return NextResponse.json({
        success: true,
        testMode: true,
        enrichedData: {
          profile: {
            name: profile.name || '',
            headline: profile.headline || '',
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
        _debug: debugInfo,
        _rawProfile: profile // Include raw profile for debugging
      });
      
    } catch (proxyError: any) {
      debugInfo.errors.push('Proxy error: ' + proxyError.message);
      
      // Fallback: Return a mock response for now
      debugInfo.steps.push('10. Using mock data as fallback');
      
      return NextResponse.json({
        success: true,
        testMode: true,
        enrichedData: {
          profile: {
            name: 'Mock Profile (Proxy Failed)',
            headline: 'Debug Mode - Check _debug for details',
            location: 'Error Location',
            skillsCount: 0,
            experienceCount: 0,
            educationCount: 0,
            isComplete: false
          },
          companies: [],
          insights: {
            totalExperience: 0,
            companiesWorked: 0,
            topSkills: []
          }
        },
        totalTime: 0,
        timestamp: new Date().toISOString(),
        _debug: debugInfo,
        _error: proxyError.message
      });
    }
    
  } catch (error) {
    debugInfo.errors.push('Main error: ' + (error instanceof Error ? error.message : String(error)));
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to scrape LinkedIn profile',
      details: String(error),
      _debug: debugInfo
    }, { status: 500 });
  }
}