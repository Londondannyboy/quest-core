/**
 * Harvest API Client for LinkedIn and Company Data Scraping
 * Based on successful implementation in AI Career Platform
 */

export interface HarvestLinkedInProfile {
  // Basic Information
  name: string;
  headline?: string;
  location?: string;
  about?: string;
  profilePicture?: string;
  
  // Professional Information
  currentPosition?: {
    title: string;
    company: string;
    startDate?: string;
    location?: string;
  };
  
  // Work Experience
  experience?: Array<{
    title: string;
    company: string;
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
  }>;
  
  // Skills
  skills?: Array<{
    name: string;
    endorsements?: number;
  }>;
  
  // Contact Information
  email?: string;
  phone?: string;
  
  // Social Media
  socialMedia?: Array<{
    platform: string;
    url: string;
  }>;
  
  // Metadata
  profileUrl: string;
  scrapedAt: Date;
  confidence: number; // 0-1 score
}

export interface HarvestCompanyData {
  // Basic Information
  name: string;
  domain?: string;
  website?: string;
  description?: string;
  logo?: string;
  linkedinUrl?: string;
  
  // Company Details
  industry?: string;
  size?: {
    range?: string;
    employees?: number;
  };
  founded?: number;
  headquarters?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
  };
  
  // Business Information
  type?: string; // Public, Private, Non-profit, etc.
  specialties?: string[];
  revenue?: {
    amount?: number;
    currency?: string;
    range?: string;
  };
  
  // Contact Information
  email?: string;
  phone?: string;
  
  // Metadata
  scrapedAt: Date;
  dataSource: 'harvest';
  confidence: number; // 0-1 score
}

export class HarvestClient {
  private apiKey: string;
  private baseUrl: string;
  private rateLimitDelay: number = 1000; // 1 second between requests
  private lastRequestTime: number = 0;

  constructor() {
    this.apiKey = process.env.HARVEST_API_KEY || '';
    this.baseUrl = process.env.HARVEST_API_URL || 'https://api.harvest.ai/v1';
    
    if (!this.apiKey) {
      throw new Error('Harvest API key not found. Set HARVEST_API_KEY environment variable.');
    }
  }

  /**
   * Test the Harvest API connection
   */
  async testConnection(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Harvest API test failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      console.log('[HarvestClient] Connection test successful');
      return data;
    } catch (error) {
      console.error('[HarvestClient] Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Scrape LinkedIn profile data
   */
  async scrapeLinkedInProfile(profileUrl: string): Promise<HarvestLinkedInProfile> {
    try {
      await this.enforceRateLimit();

      console.log('[HarvestClient] Scraping LinkedIn profile:', profileUrl);

      const response = await fetch(`${this.baseUrl}/linkedin/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: profileUrl,
          includeExperience: true,
          includeEducation: true,
          includeSkills: true,
          includeContact: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Harvest LinkedIn scraping failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      // Transform Harvest response to our format
      const profile: HarvestLinkedInProfile = {
        name: data.name || 'Unknown',
        headline: data.headline,
        location: data.location,
        about: data.about || data.summary,
        profilePicture: data.profilePicture || data.photoUrl,
        
        currentPosition: data.currentPosition ? {
          title: data.currentPosition.title,
          company: data.currentPosition.company,
          startDate: data.currentPosition.startDate,
          location: data.currentPosition.location,
        } : undefined,
        
        experience: data.experience?.map((exp: any) => ({
          title: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate,
          duration: exp.duration,
          description: exp.description,
        })) || [],
        
        education: data.education?.map((edu: any) => ({
          school: edu.school || edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startDate: edu.startDate,
          endDate: edu.endDate,
        })) || [],
        
        skills: data.skills?.map((skill: any) => ({
          name: typeof skill === 'string' ? skill : skill.name,
          endorsements: typeof skill === 'object' ? skill.endorsements : undefined,
        })) || [],
        
        email: data.email,
        phone: data.phone,
        socialMedia: data.socialMedia || [],
        
        profileUrl,
        scrapedAt: new Date(),
        confidence: data.confidence || 0.8,
      };

      console.log('[HarvestClient] Successfully scraped LinkedIn profile:', profile.name);
      return profile;

    } catch (error) {
      console.error('[HarvestClient] Error scraping LinkedIn profile:', error);
      throw error;
    }
  }

  /**
   * Scrape company data by domain
   */
  async scrapeCompanyByDomain(domain: string): Promise<HarvestCompanyData> {
    try {
      await this.enforceRateLimit();

      console.log('[HarvestClient] Scraping company by domain:', domain);

      const response = await fetch(`${this.baseUrl}/company/domain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: domain,
          includeDetails: true,
          includeFinancials: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Harvest company scraping failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      const company: HarvestCompanyData = {
        name: data.name || domain,
        domain: data.domain || domain,
        website: data.website,
        description: data.description,
        logo: data.logo,
        linkedinUrl: data.linkedinUrl,
        
        industry: data.industry,
        size: data.size ? {
          range: data.size.range,
          employees: data.size.employees,
        } : undefined,
        founded: data.founded,
        headquarters: data.headquarters,
        
        type: data.type,
        specialties: data.specialties || [],
        revenue: data.revenue,
        
        email: data.email,
        phone: data.phone,
        
        scrapedAt: new Date(),
        dataSource: 'harvest',
        confidence: data.confidence || 0.7,
      };

      console.log('[HarvestClient] Successfully scraped company:', company.name);
      return company;

    } catch (error) {
      console.error('[HarvestClient] Error scraping company:', error);
      throw error;
    }
  }

  /**
   * Scrape company data by LinkedIn URL
   */
  async scrapeCompanyByLinkedIn(linkedinUrl: string): Promise<HarvestCompanyData> {
    try {
      await this.enforceRateLimit();

      console.log('[HarvestClient] Scraping company by LinkedIn URL:', linkedinUrl);

      const response = await fetch(`${this.baseUrl}/company/linkedin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: linkedinUrl,
          includeDetails: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Harvest LinkedIn company scraping failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      const company: HarvestCompanyData = {
        name: data.name || 'Unknown Company',
        domain: data.domain,
        website: data.website,
        description: data.description,
        logo: data.logo,
        linkedinUrl,
        
        industry: data.industry,
        size: data.size ? {
          range: data.size.range,
          employees: data.size.employees,
        } : undefined,
        founded: data.founded,
        headquarters: data.headquarters,
        
        type: data.type,
        specialties: data.specialties || [],
        
        scrapedAt: new Date(),
        dataSource: 'harvest',
        confidence: data.confidence || 0.8,
      };

      console.log('[HarvestClient] Successfully scraped LinkedIn company:', company.name);
      return company;

    } catch (error) {
      console.error('[HarvestClient] Error scraping LinkedIn company:', error);
      throw error;
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
      console.log(`[HarvestClient] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Export singleton instance
export const harvestClient = new HarvestClient();