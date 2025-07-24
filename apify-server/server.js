// EXACT COPY of working apify-mp-mcp-server
// This runs as a separate Express server, not through Next.js

require('dotenv').config({ path: '../.env.local' });
const express = require('express');
const { ApifyClient } = require('apify-client');
const cors = require('cors');

const app = express();
const PORT = process.env.APIFY_SERVER_PORT || 3001;

// Initialize Apify client
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'Apify scraper server running',
        hasToken: !!process.env.APIFY_TOKEN || !!process.env.APIFY_API_KEY
    });
});

// Scrape endpoint - EXACT COPY from working project
app.post('/scrape', async (req, res) => {
    try {
        const { linkedinUrl } = req.body;
        
        if (!linkedinUrl) {
            return res.status(400).json({ error: 'LinkedIn URL is required' });
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
});

app.listen(PORT, () => {
    console.log(`Apify scraper server running on http://localhost:${PORT}`);
    console.log('Token available:', !!process.env.APIFY_TOKEN || !!process.env.APIFY_API_KEY);
});