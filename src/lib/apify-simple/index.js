// EXACT COPY of working apify-mp-mcp-server implementation
// This is pure JavaScript, no TypeScript, no Next.js complications

const { ApifyClient } = require('apify-client');

class SimpleApifyScraper {
  constructor() {
    // Initialize Apify client EXACTLY like the working example
    this.client = new ApifyClient({
      token: process.env.APIFY_TOKEN || process.env.APIFY_API_KEY,
    });
  }

  async scrapeLinkedIn(linkedinUrl) {
    try {
      if (!linkedinUrl) {
        throw new Error('LinkedIn URL is required');
      }

      console.log('Scraping LinkedIn URL:', linkedinUrl);

      // Run the actor - EXACT SAME CODE as working example
      const run = await this.client.actor('harvestapi/linkedin-profile-scraper').call({
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries: [linkedinUrl]
      });

      // Get results from the run - EXACT SAME CODE as working example
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (items && items.length > 0) {
        return { success: true, data: items[0] };
      } else {
        return { success: false, error: 'No data found' };
      }
    } catch (error) {
      console.error('Scraping error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to scrape LinkedIn profile' 
      };
    }
  }
}

// Export a singleton instance
module.exports = new SimpleApifyScraper();