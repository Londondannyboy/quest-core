import { harvestClient, HarvestLinkedInProfile } from './harvest-client';

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
  private rateLimitDelay: number = 2000; // 2 seconds between requests
  private lastRequestTime: number = 0;
  
  constructor() {
    // Harvest client is initialized as singleton with HARVEST_API_KEY
  }
  
  /**
   * Scrape a LinkedIn profile by URL using Harvest API
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
      
      console.log('[ProfileScraper] Starting Harvest API LinkedIn scrape:', profileUrl);
      
      // Test connection first
      try {
        await harvestClient.testConnection();
        console.log('[ProfileScraper] Harvest API connection verified');
      } catch (connectionError) {
        console.error('[ProfileScraper] Harvest API connection failed:', connectionError);
        throw new Error(`Harvest API connection failed: ${connectionError}`);
      }
      
      // Use Harvest API to scrape LinkedIn profile
      const harvestProfile = await harvestClient.scrapeLinkedInProfile(profileUrl);
      
      // Convert Harvest profile to our standard format
      const profile: LinkedInProfile = {
        name: harvestProfile.name,
        headline: harvestProfile.headline,
        location: harvestProfile.location,
        about: harvestProfile.about,
        profilePicture: harvestProfile.profilePicture,
        
        currentPosition: harvestProfile.currentPosition,
        experience: harvestProfile.experience,
        education: harvestProfile.education,
        skills: harvestProfile.skills,
        languages: [], // Harvest might not provide this
        certifications: [], // Harvest might not provide this
        
        profileUrl,
        scrapedAt: new Date(),
        isComplete: !!(harvestProfile.name && harvestProfile.name !== 'Unknown'),
      };
      
      console.log('[ProfileScraper] Successfully scraped profile via Harvest API:', profile.name);
      return profile;
      
    } catch (error) {
      console.error('[ProfileScraper] Error scraping profile via Harvest API:', error);
      
      // Return partial profile with error details
      return {
        name: 'Error: ' + (error instanceof Error ? error.message : String(error)),
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

// Export singleton instance (uses Harvest API client)
export const profileScraper = new ProfileScraper();