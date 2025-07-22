export interface CompanyData {
  // Basic Information
  name: string;
  domain?: string;
  description?: string;
  logo?: string;
  website?: string;
  linkedinUrl?: string;
  
  // Company Details
  industry?: string;
  size?: {
    range?: string;
    exact?: number;
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
  
  // Technology Stack
  technologies?: Array<{
    name: string;
    category?: string;
    confidence?: number;
  }>;
  
  // People & Culture
  employeeCount?: number;
  executives?: Array<{
    name: string;
    title: string;
    linkedinUrl?: string;
  }>;
  
  // Recent Updates
  recentNews?: Array<{
    title: string;
    date: Date;
    source?: string;
    url?: string;
  }>;
  
  // Metadata
  scrapedAt: Date;
  dataSource: 'harvest' | 'clearbit' | 'manual';
  confidence: number; // 0-1 score
}

export interface HarvestApiResponse {
  company: {
    name?: string;
    domain?: string;
    description?: string;
    logo?: string;
    industry?: string;
    size?: string;
    founded?: number;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    linkedin_url?: string;
    employee_count?: number;
    technologies?: string[];
    // Add more fields based on actual Harvest API response
  };
  confidence?: number;
}

export class CompanyScraper {
  private apiKey: string;
  private baseUrl: string = 'https://api.harvest.ai/v1'; // Update with actual Harvest API URL
  private rateLimitDelay: number = 1000; // 1 second between requests
  private lastRequestTime: number = 0;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.HARVEST_API_KEY;
    if (!key) {
      throw new Error('Harvest API key not found. Set HARVEST_API_KEY environment variable.');
    }
    this.apiKey = key;
  }
  
  /**
   * Scrape company data by domain
   * @param domain Company domain (e.g., "google.com")
   * @returns Structured company data
   */
  async scrapeByDomain(domain: string): Promise<CompanyData> {
    try {
      // Enforce rate limiting
      await this.enforceRateLimit();
      
      // Clean domain
      const cleanDomain = this.cleanDomain(domain);
      
      console.log('[CompanyScraper] Fetching company data for:', cleanDomain);
      
      // Make API request to Harvest
      const response = await fetch(`${this.baseUrl}/companies/domain/${cleanDomain}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Harvest API error: ${response.status} ${response.statusText}`);
      }
      
      const data: HarvestApiResponse = await response.json();
      
      // Transform Harvest data to our schema
      const companyData = this.transformHarvestData(data, cleanDomain);
      
      console.log('[CompanyScraper] Successfully scraped company:', companyData.name);
      return companyData;
      
    } catch (error) {
      console.error('[CompanyScraper] Error scraping company:', error);
      
      // Return minimal data on error
      return {
        name: domain,
        domain,
        scrapedAt: new Date(),
        dataSource: 'harvest',
        confidence: 0
      };
    }
  }
  
  /**
   * Scrape company data by LinkedIn URL
   * @param linkedinUrl Company LinkedIn URL
   * @returns Structured company data
   */
  async scrapeByLinkedIn(linkedinUrl: string): Promise<CompanyData> {
    try {
      await this.enforceRateLimit();
      
      // Extract company identifier from LinkedIn URL
      const companyId = this.extractLinkedInCompanyId(linkedinUrl);
      if (!companyId) {
        throw new Error('Invalid LinkedIn company URL');
      }
      
      console.log('[CompanyScraper] Fetching company data for LinkedIn:', companyId);
      
      // Make API request
      const response = await fetch(`${this.baseUrl}/companies/linkedin/${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Harvest API error: ${response.status}`);
      }
      
      const data: HarvestApiResponse = await response.json();
      return this.transformHarvestData(data, undefined, linkedinUrl);
      
    } catch (error) {
      console.error('[CompanyScraper] Error scraping company by LinkedIn:', error);
      
      return {
        name: 'Unknown',
        linkedinUrl,
        scrapedAt: new Date(),
        dataSource: 'harvest',
        confidence: 0
      };
    }
  }
  
  /**
   * Enrich company data with additional sources
   * @param companyData Basic company data
   * @returns Enriched company data
   */
  async enrichCompanyData(companyData: CompanyData): Promise<CompanyData> {
    try {
      // Could integrate with additional APIs here
      // - Clearbit for more company details
      // - Crunchbase for funding information
      // - BuiltWith for technology stack
      // - News APIs for recent updates
      
      // For now, return as-is
      return companyData;
      
    } catch (error) {
      console.error('[CompanyScraper] Error enriching company data:', error);
      return companyData;
    }
  }
  
  /**
   * Batch scrape multiple companies
   * @param identifiers Array of domains or LinkedIn URLs
   * @returns Array of company data
   */
  async scrapeCompanies(identifiers: string[]): Promise<CompanyData[]> {
    const companies: CompanyData[] = [];
    
    for (const identifier of identifiers) {
      try {
        let companyData: CompanyData;
        
        if (identifier.includes('linkedin.com')) {
          companyData = await this.scrapeByLinkedIn(identifier);
        } else {
          companyData = await this.scrapeByDomain(identifier);
        }
        
        companies.push(companyData);
      } catch (error) {
        console.error(`[CompanyScraper] Failed to scrape ${identifier}:`, error);
        companies.push({
          name: identifier,
          scrapedAt: new Date(),
          dataSource: 'harvest',
          confidence: 0
        });
      }
    }
    
    return companies;
  }
  
  /**
   * Transform Harvest API response to our schema
   */
  private transformHarvestData(
    data: HarvestApiResponse, 
    domain?: string,
    linkedinUrl?: string
  ): CompanyData {
    const company = data.company || {};
    
    return {
      name: company.name || 'Unknown',
      domain: company.domain || domain,
      description: company.description,
      logo: company.logo,
      website: company.domain ? `https://${company.domain}` : undefined,
      linkedinUrl: company.linkedin_url || linkedinUrl,
      
      industry: company.industry,
      size: company.size ? { range: company.size } : undefined,
      founded: company.founded,
      
      headquarters: company.location ? {
        city: company.location.city,
        state: company.location.state,
        country: company.location.country
      } : undefined,
      
      employeeCount: company.employee_count,
      
      technologies: company.technologies?.map(tech => ({
        name: tech,
        confidence: 0.8 // Default confidence
      })),
      
      scrapedAt: new Date(),
      dataSource: 'harvest',
      confidence: data.confidence || 0.7
    };
  }
  
  /**
   * Clean and normalize domain
   */
  private cleanDomain(domain: string): string {
    // Remove protocol
    domain = domain.replace(/^https?:\/\//, '');
    // Remove www
    domain = domain.replace(/^www\./, '');
    // Remove trailing slash
    domain = domain.replace(/\/$/, '');
    // Remove path
    domain = domain.split('/')[0];
    
    return domain.toLowerCase();
  }
  
  /**
   * Extract company ID from LinkedIn URL
   */
  private extractLinkedInCompanyId(url: string): string | null {
    // Match patterns like:
    // https://www.linkedin.com/company/google/
    // https://www.linkedin.com/company/1234567/
    const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
    return match ? match[1] : null;
  }
  
  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`[CompanyScraper] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Validate company domain
   */
  static isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  }
  
  /**
   * Extract domain from email
   */
  static extractDomainFromEmail(email: string): string | null {
    const parts = email.split('@');
    return parts.length === 2 ? parts[1] : null;
  }
}

// Export singleton instance
export const companyScraper = new CompanyScraper();