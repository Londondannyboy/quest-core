import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.APIFY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'APIFY_API_KEY not configured' }, { status: 500 });
    }
    
    const tests = [
      {
        name: 'Company Employees Task (Z4hQMjDxMd5Gk4Cmj)',
        endpoint: 'https://api.apify.com/v2/actor-tasks/Z4hQMjDxMd5Gk4Cmj/runs',
        input: {
          companies: ['https://www.linkedin.com/company/google'],
          searchQuery: 'engineer',
          maxItems: 5,
          profileScraperMode: 'Fast'
        }
      },
      {
        name: 'Profile Scraper Actor (harvestapi/linkedin-profile-scraper)', 
        endpoint: 'https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs',
        input: {
          startUrls: ['https://www.linkedin.com/in/dankeegan/'],
          proxy: {
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL']
          }
        }
      },
      {
        name: 'Company Employees Actor (harvestapi/linkedin-company-employees)',
        endpoint: 'https://api.apify.com/v2/acts/harvestapi~linkedin-company-employees/runs',
        input: {
          companies: ['https://www.linkedin.com/company/google'],
          searchQuery: 'founder',
          maxItems: 5,
          profileScraperMode: 'Fast'
        }
      }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`[Test Scraping All] Testing: ${test.name}`);
        
        const response = await fetch(test.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(test.input),
        });
        
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
        
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          runId: response.ok ? data.data?.id : null,
          error: !response.ok ? data : null,
          message: response.ok ? 'Started successfully - check Apify dashboard' : 'Failed to start'
        });
        
      } catch (error) {
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          error: String(error),
          message: 'Request failed'
        });
      }
    }
    
    return NextResponse.json({
      message: 'Tested all scraping options',
      results,
      successCount: results.filter(r => r.success).length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Test failed',
      details: String(error)
    }, { status: 500 });
  }
}