// Pure JavaScript API route - no TypeScript
const scraper = require('../../../lib/apify-simple');

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await scraper.scrapeLinkedIn(body.linkedinUrl);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}