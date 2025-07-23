import { apifyClient, APIFY_ACTORS, ApifyRunOutput } from './apify-client';

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
    // Apify client is initialized as singleton with APIFY_API_KEY
  }
  
  /**
   * Scrape a LinkedIn profile by URL using Apify + Harvest actors
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
      
      console.log('[ProfileScraper] Starting Apify Harvest LinkedIn scrape:', profileUrl);
      
      // Test connection first
      try {
        await apifyClient.testConnection();
        console.log('[ProfileScraper] Apify connection verified');
      } catch (connectionError) {
        console.error('[ProfileScraper] Apify connection failed:', connectionError);
        throw new Error(`Apify connection failed: ${connectionError}`);
      }
      
      // Try Harvest LinkedIn actor first (proven working)
      let results: ApifyRunOutput[];
      try {
        console.log('[ProfileScraper] Using Harvest LinkedIn actor:', APIFY_ACTORS.HARVEST_LINKEDIN_PROFILE);
        results = await apifyClient.scrape(APIFY_ACTORS.HARVEST_LINKEDIN_PROFILE, {
          profileUrls: [profileUrl],
          scraperMode: 'Fast',
          maxItems: 1
        });
      } catch (harvestError) {
        console.warn('[ProfileScraper] Harvest actor failed, trying fallback:', harvestError);
        // Fallback to alternative LinkedIn scraper
        results = await apifyClient.scrape(APIFY_ACTORS.LINKEDIN_PROFILE_FALLBACK, {
          startUrls: [{ url: profileUrl }]
        });
      }
      
      if (!results || results.length === 0) {
        throw new Error('No data returned from LinkedIn scraper');
      }
      
      const rawProfile = results[0];
      
      // Transform Apify result to our standard format
      const profile: LinkedInProfile = {
        name: rawProfile.name || rawProfile.fullName || 'Unknown',
        headline: rawProfile.headline || rawProfile.title,
        location: rawProfile.location,
        about: rawProfile.about || rawProfile.summary,
        profilePicture: rawProfile.profilePicture || rawProfile.photoUrl,
        
        currentPosition: rawProfile.currentPosition ? {
          title: rawProfile.currentPosition.title,
          company: rawProfile.currentPosition.company,
          companyLogo: rawProfile.currentPosition.companyLogo,
          startDate: rawProfile.currentPosition.startDate,
          location: rawProfile.currentPosition.location,
        } : undefined,
        
        experience: rawProfile.experience?.map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          companyLogo: exp.companyLogo,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          duration: exp.duration,
          description: exp.description,
        })) || [],
        
        education: rawProfile.education?.map((edu: any) => ({
          school: edu.school || edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startDate: edu.startDate,
          endDate: edu.endDate,
          description: edu.description,
        })) || [],
        
        skills: rawProfile.skills?.map((skill: any) => ({
          name: typeof skill === 'string' ? skill : skill.name,
          endorsements: typeof skill === 'object' ? skill.endorsements : undefined,
        })) || [],
        
        languages: rawProfile.languages || [],
        certifications: rawProfile.certifications?.map((cert: any) => ({
          name: cert.name,
          issuingOrganization: cert.issuingOrganization,
          issueDate: cert.issueDate,
        })) || [],
        
        profileUrl,
        scrapedAt: new Date(),
        isComplete: !!(rawProfile.name || rawProfile.fullName),
      };
      
      console.log('[ProfileScraper] Successfully scraped profile via Apify Harvest:', profile.name);
      return profile;
      
    } catch (error) {
      console.error('[ProfileScraper] Error scraping profile via Apify Harvest:', error);
      
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

// Export singleton instance (uses Apify + Harvest actors)
export const profileScraper = new ProfileScraper();