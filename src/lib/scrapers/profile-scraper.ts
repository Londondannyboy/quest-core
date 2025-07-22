import { ScrapflyClient, ScrapeConfig } from 'scrapfly-sdk';

export interface LinkedInProfile {
  // Basic Information
  name: string;
  headline?: string;
  location?: string;
  about?: string;
  profilePicture?: string;
  backgroundImage?: string;
  
  // Professional Information
  currentPosition?: {
    title: string;
    company: string;
    companyLogo?: string;
    startDate?: string;
    location?: string;
  };
  
  // Work Experience
  experience?: Array<{
    title: string;
    company: string;
    companyLogo?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
    description?: string;
  }>;
  
  // Education
  education?: Array<{
    school: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  
  // Skills & Endorsements
  skills?: Array<{
    name: string;
    endorsements?: number;
  }>;
  
  // Additional Information
  languages?: string[];
  certifications?: Array<{
    name: string;
    issuingOrganization?: string;
    issueDate?: string;
  }>;
  
  // Metadata
  profileUrl: string;
  scrapedAt: Date;
  isComplete: boolean;
}

export class ProfileScraper {
  private client: ScrapflyClient;
  private rateLimitDelay: number = 2000; // 2 seconds between requests
  private lastRequestTime: number = 0;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.SCRAPFLY_API_KEY;
    if (!key) {
      throw new Error('Scrapfly API key not found. Set SCRAPFLY_API_KEY environment variable.');
    }
    
    this.client = new ScrapflyClient({ key });
  }
  
  /**
   * Scrape a LinkedIn profile by URL
   * @param profileUrl LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)
   * @returns Parsed LinkedIn profile data
   */
  async scrapeProfile(profileUrl: string): Promise<LinkedInProfile> {
    try {
      // Respect rate limiting
      await this.enforceRateLimit();
      
      // Validate LinkedIn URL
      if (!this.isValidLinkedInUrl(profileUrl)) {
        throw new Error('Invalid LinkedIn profile URL');
      }
      
      // Configure scrape request
      const scrapeConfig = new ScrapeConfig({
        url: profileUrl,
        asp: true, // Anti-bot bypass
        country: 'US',
        render_js: false, // LinkedIn data is in static HTML
        timeout: 30000,
        retry: true,
        cache: true,
        cache_ttl: 3600, // Cache for 1 hour
      });
      
      // Execute scrape
      console.log('[ProfileScraper] Scraping profile:', profileUrl);
      const result = await this.client.scrape(scrapeConfig);
      
      // Check if scraping was successful
      if (!result || result.status_code !== 200) {
        throw new Error(`Scraping failed: ${result?.status_code || 'Unknown error'}`);
      }
      
      // Parse the scraped data
      const profile = this.parseProfileData(result, profileUrl);
      
      console.log('[ProfileScraper] Successfully scraped profile:', profile.name);
      return profile;
      
    } catch (error) {
      console.error('[ProfileScraper] Error scraping profile:', error);
      
      // Return partial profile on error
      return {
        name: 'Unknown',
        profileUrl,
        scrapedAt: new Date(),
        isComplete: false
      };
    }
  }
  
  /**
   * Batch scrape multiple LinkedIn profiles
   * @param profileUrls Array of LinkedIn profile URLs
   * @returns Array of parsed profiles
   */
  async scrapeProfiles(profileUrls: string[]): Promise<LinkedInProfile[]> {
    const profiles: LinkedInProfile[] = [];
    
    for (const url of profileUrls) {
      try {
        const profile = await this.scrapeProfile(url);
        profiles.push(profile);
      } catch (error) {
        console.error(`[ProfileScraper] Failed to scrape ${url}:`, error);
        profiles.push({
          name: 'Unknown',
          profileUrl: url,
          scrapedAt: new Date(),
          isComplete: false
        });
      }
    }
    
    return profiles;
  }
  
  /**
   * Parse scraped HTML/JSON data into structured profile
   */
  private parseProfileData(result: any, profileUrl: string): LinkedInProfile {
    try {
      const selector = result.selector;
      
      // Try to get structured data from JSON-LD
      const jsonLdScript = selector.xpath("//script[@type='application/ld+json']/text()").get();
      let structuredData: any = {};
      
      if (jsonLdScript) {
        try {
          structuredData = JSON.parse(jsonLdScript);
        } catch (e) {
          console.log('[ProfileScraper] Could not parse JSON-LD data');
        }
      }
      
      // Extract profile data using multiple strategies
      const profile: LinkedInProfile = {
        name: this.extractName(selector, structuredData),
        headline: this.extractHeadline(selector, structuredData),
        location: this.extractLocation(selector, structuredData),
        about: this.extractAbout(selector),
        profilePicture: this.extractProfilePicture(selector, structuredData),
        currentPosition: this.extractCurrentPosition(selector),
        experience: this.extractExperience(selector),
        education: this.extractEducation(selector),
        skills: this.extractSkills(selector),
        profileUrl,
        scrapedAt: new Date(),
        isComplete: true
      };
      
      return profile;
      
    } catch (error) {
      console.error('[ProfileScraper] Error parsing profile data:', error);
      return {
        name: 'Parse Error',
        profileUrl,
        scrapedAt: new Date(),
        isComplete: false
      };
    }
  }
  
  // Extraction helper methods
  private extractName(selector: any, structuredData: any): string {
    // Try structured data first
    if (structuredData?.name) return structuredData.name;
    
    // Fallback to HTML selectors
    const nameSelectors = [
      "//h1[contains(@class, 'top-card-layout__title')]/text()",
      "//h1[@class='text-heading-xlarge inline t-24 v-align-middle break-words']/text()",
      "//div[@class='ph5 pb5']//h1/text()"
    ];
    
    for (const sel of nameSelectors) {
      const name = selector.xpath(sel).get();
      if (name) return name.trim();
    }
    
    return 'Unknown';
  }
  
  private extractHeadline(selector: any, structuredData: any): string | undefined {
    if (structuredData?.jobTitle) return structuredData.jobTitle;
    
    const headlineSelectors = [
      "//div[contains(@class, 'top-card-layout__headline')]/text()",
      "//h2[@class='mt1 t-18 t-black t-normal break-words']/text()",
      "//div[@class='ph5 pb5']//h2/text()"
    ];
    
    for (const sel of headlineSelectors) {
      const headline = selector.xpath(sel).get();
      if (headline) return headline.trim();
    }
    
    return undefined;
  }
  
  private extractLocation(selector: any, structuredData: any): string | undefined {
    if (structuredData?.address?.addressLocality) {
      return structuredData.address.addressLocality;
    }
    
    const locationSelectors = [
      "//span[contains(@class, 'top-card__subline-item')]/text()",
      "//span[@class='t-16 t-black t-normal inline-block']/text()"
    ];
    
    for (const sel of locationSelectors) {
      const location = selector.xpath(sel).get();
      if (location && !location.includes('follower')) {
        return location.trim();
      }
    }
    
    return undefined;
  }
  
  private extractAbout(selector: any): string | undefined {
    const aboutSelectors = [
      "//section[contains(@class, 'summary')]//span[@aria-hidden='true']/text()",
      "//section[@id='about']//span[contains(@class, 'visually-hidden')]/following-sibling::span/text()"
    ];
    
    for (const sel of aboutSelectors) {
      const about = selector.xpath(sel).get();
      if (about) return about.trim();
    }
    
    return undefined;
  }
  
  private extractProfilePicture(selector: any, structuredData: any): string | undefined {
    if (structuredData?.image) return structuredData.image;
    
    const pictureSelectors = [
      "//img[contains(@class, 'profile-photo-edit__preview')]/@src",
      "//img[contains(@class, 'presence-entity__image')]/@src",
      "//button[@aria-label='Change profile photo']//img/@src"
    ];
    
    for (const sel of pictureSelectors) {
      const picture = selector.xpath(sel).get();
      if (picture) return picture;
    }
    
    return undefined;
  }
  
  private extractCurrentPosition(selector: any): LinkedInProfile['currentPosition'] | undefined {
    // This would need more sophisticated parsing of the experience section
    // For now, return undefined - can be enhanced based on actual HTML structure
    return undefined;
  }
  
  private extractExperience(selector: any): LinkedInProfile['experience'] {
    // Would parse the experience section
    // Placeholder for actual implementation
    return [];
  }
  
  private extractEducation(selector: any): LinkedInProfile['education'] {
    // Would parse the education section
    // Placeholder for actual implementation
    return [];
  }
  
  private extractSkills(selector: any): LinkedInProfile['skills'] {
    // Would parse the skills section
    // Placeholder for actual implementation
    return [];
  }
  
  /**
   * Validate LinkedIn URL format
   */
  private isValidLinkedInUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('linkedin.com') && 
             parsed.pathname.includes('/in/');
    } catch {
      return false;
    }
  }
  
  /**
   * Enforce rate limiting between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`[ProfileScraper] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Extract LinkedIn username from URL
   */
  static extractUsername(profileUrl: string): string | null {
    const match = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
  
  /**
   * Build LinkedIn URL from username
   */
  static buildProfileUrl(username: string): string {
    return `https://www.linkedin.com/in/${username}`;
  }
}

// Export singleton instance
export const profileScraper = new ProfileScraper();