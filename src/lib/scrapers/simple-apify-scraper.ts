/**
 * Simplified Apify scraper using the official SDK
 * Based on the working implementation from apify-mp-mcp-server
 */

import { ApifyClient } from 'apify-client';

export interface SimpleLinkedInProfile {
  name?: string;
  headline?: string;
  location?: string;
  summary?: string;
  profileUrl?: string;
  currentPosition?: {
    title: string;
    company: string;
  };
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
  education?: Array<{
    school: string;
    degree: string;
  }>;
  skills?: Array<{
    name: string;
  }>;
  [key: string]: any;
}

export class SimpleApifyScraper {
  private client: ApifyClient;

  constructor() {
    const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
    
    if (!token) {
      throw new Error('APIFY_TOKEN or APIFY_API_KEY environment variable is required');
    }

    this.client = new ApifyClient({
      token: token,
    });
  }

  /**
   * Scrape a LinkedIn profile using the official Apify SDK
   * This is the exact same pattern that works in apify-mp-mcp-server
   */
  async scrapeLinkedInProfile(linkedinUrl: string): Promise<SimpleLinkedInProfile> {
    console.log('[SimpleApifyScraper] Scraping LinkedIn URL:', linkedinUrl);

    try {
      // Run the actor - exact same call as the working example
      const run = await this.client.actor('harvestapi/linkedin-profile-scraper').call({
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries: [linkedinUrl]
      });

      console.log('[SimpleApifyScraper] Actor run completed:', run.id);

      // Get results from the run - exact same call as the working example
      const { items } = await this.client.dataset(run.defaultDatasetId).listItems();
      
      if (items && items.length > 0) {
        console.log('[SimpleApifyScraper] Successfully retrieved profile data');
        return items[0] as SimpleLinkedInProfile;
      } else {
        throw new Error('No data found for the provided LinkedIn profile');
      }
    } catch (error) {
      console.error('[SimpleApifyScraper] Scraping error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const simpleApifyScraper = new SimpleApifyScraper();