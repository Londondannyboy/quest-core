/**
 * Apify API Client for Quest Core Scraping Infrastructure
 * Replaces direct Scrapfly/Harvest integrations with Apify orchestration
 */

export interface ApifyRunInput {
  [key: string]: any;
}

export interface ApifyRunOutput {
  [key: string]: any;
}

export interface ApifyRunResult {
  id: string;
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED';
  statusMessage?: string;
  startedAt: string;
  finishedAt?: string;
  stats: {
    inputBodyLen: number;
    outputBodyLen: number;
    durationMillis: number;
  };
  defaultDatasetId: string;
  defaultKeyValueStoreId: string;
}

export class ApifyClient {
  private apiKey: string;
  private userId?: string;
  private baseURL = 'https://api.apify.com/v2';

  constructor(apiKey?: string, userId?: string) {
    this.apiKey = apiKey || process.env.APIFY_API_KEY || '';
    this.userId = userId || process.env.APIFY_USER_ID;
    
    if (!this.apiKey) {
      throw new Error('Apify API key not found. Set APIFY_API_KEY environment variable.');
    }
  }

  /**
   * Run an Apify actor and wait for completion
   * @param actorId The Apify actor ID or name
   * @param input Input data for the actor
   * @param options Run options (timeout, memory, build)
   * @returns Promise that resolves when the run completes
   */
  async runActor(
    actorId: string,
    input: ApifyRunInput,
    options: {
      timeout?: number; // seconds
      memory?: number; // MB
      build?: string;
      waitForFinish?: boolean;
    } = {}
  ): Promise<ApifyRunResult> {
    const { waitForFinish = true, ...runOptions } = options;

    // Start the actor run
    const runResponse = await fetch(`${this.baseURL}/acts/${actorId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...runOptions,
        ...input,
      }),
    });

    if (!runResponse.ok) {
      const error = await runResponse.text();
      throw new Error(`Failed to start Apify actor: ${runResponse.status} ${error}`);
    }

    const runData: ApifyRunResult = await runResponse.json();
    console.log(`[ApifyClient] Started actor run: ${runData.id}`);

    if (!waitForFinish) {
      return runData;
    }

    // Wait for completion
    return this.waitForRun(runData.id, options.timeout || 300); // 5 minute default timeout
  }

  /**
   * Wait for an actor run to complete
   * @param runId The run ID to wait for
   * @param timeoutSeconds Maximum time to wait
   * @returns The completed run result
   */
  async waitForRun(runId: string, timeoutSeconds: number = 300): Promise<ApifyRunResult> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      const result = await this.getRun(runId);
      
      if (result.status === 'SUCCEEDED') {
        console.log(`[ApifyClient] Run completed successfully: ${runId}`);
        return result;
      }
      
      if (result.status === 'FAILED' || result.status === 'TIMED-OUT' || result.status === 'ABORTED') {
        throw new Error(`Apify run failed: ${result.status} - ${result.statusMessage}`);
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error(`Apify run timed out after ${timeoutSeconds} seconds`);
  }

  /**
   * Get the status and details of a run
   * @param runId The run ID
   * @returns Run details
   */
  async getRun(runId: string): Promise<ApifyRunResult> {
    const response = await fetch(`${this.baseURL}/actor-runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get run status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get the dataset items from a completed run
   * @param runId The run ID
   * @returns Array of scraped data items
   */
  async getRunResults(runId: string): Promise<ApifyRunOutput[]> {
    const run = await this.getRun(runId);
    
    if (run.status !== 'SUCCEEDED') {
      throw new Error(`Cannot get results from run with status: ${run.status}`);
    }

    const response = await fetch(
      `${this.baseURL}/datasets/${run.defaultDatasetId}/items`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get run results: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Run an actor and get results in one call
   * @param actorId The Apify actor ID
   * @param input Input data
   * @param options Run options
   * @returns Scraped data results
   */
  async scrape(
    actorId: string,
    input: ApifyRunInput,
    options: {
      timeout?: number;
      memory?: number;
    } = {}
  ): Promise<ApifyRunOutput[]> {
    console.log('[ApifyClient] Starting scrape with actor:', actorId);
    console.log('[ApifyClient] Input data:', JSON.stringify(input, null, 2));
    console.log('[ApifyClient] Options:', options);
    
    try {
      const run = await this.runActor(actorId, input, {
        ...options,
        waitForFinish: true,
      });

      return this.getRunResults(run.id);
    } catch (error) {
      console.error('[ApifyClient] Scrape failed:', error);
      throw error;
    }
  }

  /**
   * List available actors in the account
   * @returns List of available actors
   */
  async listActors(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/acts`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list actors: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('[ApifyClient] Failed to list actors:', error);
      throw error;
    }
  }

  /**
   * Test the connection and API key
   * @returns User information if successful
   */
  async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API test failed: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log('[ApifyClient] Connection successful, user:', data.data?.username);
      return data.data;
    } catch (error) {
      console.error('[ApifyClient] Connection test failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apifyClient = new ApifyClient();

// Popular Apify actors for scraping
export const APIFY_ACTORS = {
  // Try different LinkedIn scrapers that might be available
  LINKEDIN_PROFILE: 'trudax/linkedin-profile-scraper', // Alternative that's commonly used
  LINKEDIN_PROFILE_ALT: 'apify/linkedin-profile-scraper', // Original attempt
  
  // LinkedIn company scraper  
  LINKEDIN_COMPANY: 'apify/linkedin-company-scraper',
  
  // Web scraper for general use
  WEB_SCRAPER: 'apify/web-scraper',
  
  // Cheerio scraper for structured data
  CHEERIO_SCRAPER: 'apify/cheerio-scraper',
  
  // LinkedIn scraper by Scrapfly (might be more reliable)
  SCRAPFLY_LINKEDIN: 'scrapfly/linkedin-profile-scraper',
} as const;