import { NextResponse } from 'next/server';

// EXACT COPY of working code from apify-mp-mcp-server
const { ApifyClient } = require('apify-client');

// Initialize Apify client
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { linkedinUrl } = await request.json();
        
        if (!linkedinUrl) {
            return NextResponse.json({ error: 'LinkedIn URL is required' }, { status: 400 });
        }

        console.log('Scraping LinkedIn URL:', linkedinUrl);

        // Run the actor
        const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
            profileScraperMode: "Profile details no email ($4 per 1k)",
            queries: [linkedinUrl]
        });

        // Get results from the run
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        if (items && items.length > 0) {
            return NextResponse.json({ success: true, data: items[0] });
        } else {
            return NextResponse.json({ success: false, error: 'No data found' });
        }
    } catch (error: any) {
        console.error('Scraping error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Failed to scrape LinkedIn profile' 
        }, { status: 500 });
    }
}