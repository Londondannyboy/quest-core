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
    // Apify client is initialized as singleton, no API key needed here
    // The client will throw if APIFY_API_KEY is not set
  }
  
  /**
   * Scrape a LinkedIn profile by URL using Apify
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
      
      console.log('[ProfileScraper] Starting Apify LinkedIn scrape:', profileUrl);
      
      // Test connection first
      try {
        await apifyClient.testConnection();
        console.log('[ProfileScraper] Apify connection verified');
      } catch (connectionError) {
        console.error('[ProfileScraper] Apify connection failed:', connectionError);
        throw new Error(`Apify connection failed: ${connectionError}`);
      }
      
      // Try different LinkedIn scrapers
      const actorsToTry = [
        { id: APIFY_ACTORS.LINKEDIN_PROFILE, name: 'trudax/linkedin-profile-scraper' },
        { id: APIFY_ACTORS.LINKEDIN_PROFILE_ALT, name: 'apify/linkedin-profile-scraper' }
      ];
      
      let lastError: Error | null = null;
      
      for (const actor of actorsToTry) {
        try {
          console.log(`[ProfileScraper] Trying actor: ${actor.name}`);
          
          // Use simpler input format that most LinkedIn scrapers accept
          const results = await apifyClient.scrape(
            actor.id,
            {
              startUrls: [profileUrl],
              // Remove parameters that might not be supported
            },
            {
              timeout: 180, // 3 minutes timeout
              memory: 2048, // 2GB memory
            }
          );
          
          if (results && results.length > 0) {
            console.log('[ProfileScraper] Got results from actor:', actor.name);
            const profileData = results[0];
            const profile = this.parseApifyProfileData(profileData, profileUrl);
            
            console.log('[ProfileScraper] Successfully scraped profile via Apify:', profile.name);
            return profile;
          } else {
            console.log(`[ProfileScraper] No results from actor: ${actor.name}`);
          }
        } catch (error) {
          console.error(`[ProfileScraper] Actor ${actor.name} failed:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));
          // Continue to next actor
        }
      }
      
      // If we get here, all actors failed
      throw new Error(`All LinkedIn actors failed. Last error: ${lastError?.message}`);
      
    } catch (error) {
      console.error('[ProfileScraper] Error scraping profile via Apify:', error);
      
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
   * Parse Apify LinkedIn profile data into structured profile
   */
  private parseApifyProfileData(apifyData: ApifyRunOutput, profileUrl: string): LinkedInProfile {
    try {
      console.log('[ProfileScraper] Parsing Apify profile data:', JSON.stringify(apifyData, null, 2));
      
      // Apify LinkedIn Profile Scraper returns structured data
      const profile: LinkedInProfile = {
        name: apifyData.fullName || apifyData.name || 'Unknown',
        headline: apifyData.headline || apifyData.tagline,
        location: apifyData.location || apifyData.locationName,
        about: apifyData.about || apifyData.summary,
        profilePicture: apifyData.profilePicture || apifyData.photoUrl,
        backgroundImage: apifyData.backgroundImage,
        
        // Current position from experience array
        currentPosition: apifyData.experience && apifyData.experience.length > 0 ? {
          title: apifyData.experience[0].title,
          company: apifyData.experience[0].companyName,
          companyLogo: apifyData.experience[0].companyLogo,
          startDate: apifyData.experience[0].startDate,
          location: apifyData.experience[0].location,
        } : undefined,
        
        // Work experience
        experience: this.parseApifyExperience(apifyData.experience || []),
        
        // Education
        education: this.parseApifyEducation(apifyData.education || []),
        
        // Skills
        skills: this.parseApifySkills(apifyData.skills || []),
        
        // Languages
        languages: apifyData.languages || [],
        
        // Certifications
        certifications: this.parseApifyCertifications(apifyData.certifications || []),
        
        profileUrl,
        scrapedAt: new Date(),
        isComplete: !!(apifyData.fullName || apifyData.name) // Complete if we got a name
      };
      
      return profile;
      
    } catch (error) {
      console.error('[ProfileScraper] Error parsing Apify profile data:', error);
      return {
        name: 'Parse Error',
        profileUrl,
        scrapedAt: new Date(),
        isComplete: false
      };
    }
  }
  
  // Apify data parsing helper methods
  private parseApifyExperience(experienceData: any[]): LinkedInProfile['experience'] {
    return experienceData.map(exp => ({
      title: exp.title || exp.positionName,
      company: exp.companyName || exp.company,
      companyLogo: exp.companyLogo,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      duration: exp.duration,
      description: exp.description,
    }));
  }
  
  private parseApifyEducation(educationData: any[]): LinkedInProfile['education'] {
    return educationData.map(edu => ({
      school: edu.schoolName || edu.institution,
      degree: edu.degree || edu.degreeName,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description,
    }));
  }
  
  private parseApifySkills(skillsData: any[]): LinkedInProfile['skills'] {
    if (Array.isArray(skillsData)) {
      return skillsData.map(skill => {
        if (typeof skill === 'string') {
          return { name: skill };
        }
        return {
          name: skill.name || skill.skillName,
          endorsements: skill.endorsements || skill.endorsementCount,
        };
      });
    }
    return [];
  }
  
  private parseApifyCertifications(certificationsData: any[]): LinkedInProfile['certifications'] {
    return certificationsData.map(cert => ({
      name: cert.name || cert.certificationName,
      issuingOrganization: cert.issuingOrganization || cert.authority,
      issueDate: cert.issueDate || cert.dateObtained,
    }));
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

// Export singleton instance (no API key needed - uses Apify client)
export const profileScraper = new ProfileScraper();