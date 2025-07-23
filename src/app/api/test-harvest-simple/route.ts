import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.APIFY_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'APIFY_API_KEY not configured',
      message: 'Add APIFY_API_KEY to environment variables' 
    }, { status: 500 });
  }
  
  return NextResponse.json({
    message: 'Ready to test scraping',
    configured: true,
    possibleTests: [
      {
        name: 'Individual Profile Scraper',
        actor: 'harvestapi/linkedin-profile-scraper',
        taskId: 'Unknown - need to create task or find ID',
        input: {
          startUrls: ['https://www.linkedin.com/in/dankeegan/']
        }
      },
      {
        name: 'Company Employees Scraper',
        actor: 'harvestapi/linkedin-company-employees', 
        taskId: 'Z4hQMjDxMd5Gk4Cmj',
        input: {
          companies: ['https://www.linkedin.com/company/google'],
          profileScraperMode: 'Fast',
          maxItems: 5
        }
      }
    ],
    nextStep: 'We need to find the correct task ID for individual profile scraping or create a new task'
  });
}