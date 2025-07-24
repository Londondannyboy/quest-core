// Vercel serverless function - outside of Next.js app directory
// This might work better with Vercel's environment

const { ApifyClient } = require('apify-client');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { linkedinUrl } = req.body;
    
    if (!linkedinUrl) {
      return res.status(400).json({ error: 'LinkedIn URL is required' });
    }

    // Initialize client inside the function
    const client = new ApifyClient({
      token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
    });

    console.log('Scraping LinkedIn URL:', linkedinUrl);

    // Run the actor
    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [linkedinUrl]
    });

    // Get results from the run
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items && items.length > 0) {
      res.json({ success: true, data: items[0] });
    } else {
      res.json({ success: false, error: 'No data found' });
    }
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to scrape LinkedIn profile' 
    });
  }
};