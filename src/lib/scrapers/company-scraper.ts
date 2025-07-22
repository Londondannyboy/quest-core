import { apifyClient, APIFY_ACTORS, ApifyRunOutput } from './apify-client';

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
  dataSource: 'apify-harvest' | 'clearbit' | 'manual';
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
  private rateLimitDelay: number = 1000; // 1 second between requests
  private lastRequestTime: number = 0;
  
  constructor() {
    // Apify client is initialized as singleton with APIFY_API_KEY
  }
  
  /**
   * Scrape company data by domain using Apify + Harvest actors
   * @param domain Company domain (e.g., "google.com")
   * @returns Structured company data
   */
  async scrapeByDomain(domain: string): Promise<CompanyData> {
    try {
      // Enforce rate limiting
      await this.enforceRateLimit();
      
      // Clean domain
      const cleanDomain = this.cleanDomain(domain);
      
      console.log('[CompanyScraper] Starting Apify Harvest company scrape for:', cleanDomain);
      
      // Try Harvest company domain actor first
      let results: ApifyRunOutput[];
      try {
        console.log('[CompanyScraper] Using Harvest company domain actor:', APIFY_ACTORS.HARVEST_COMPANY_DOMAIN);
        results = await apifyClient.scrape(APIFY_ACTORS.HARVEST_COMPANY_DOMAIN, {
          domains: [cleanDomain],
          includeDetails: true
        });
      } catch (harvestError) {
        console.warn('[CompanyScraper] Harvest company actor failed:', harvestError);
        throw harvestError; // Re-throw for now, can add fallbacks later
      }
      
      if (!results || results.length === 0) {
        throw new Error('No data returned from company scraper');
      }
      
      const rawCompany = results[0];
      
      // Transform Apify/Harvest result to our standard format
      const companyData: CompanyData = {
        name: rawCompany.name || rawCompany.companyName || cleanDomain,
        domain: rawCompany.domain || cleanDomain,
        description: rawCompany.description || rawCompany.about,
        logo: rawCompany.logo || rawCompany.logoUrl,
        website: rawCompany.website || `https://${cleanDomain}`,
        linkedinUrl: rawCompany.linkedinUrl || rawCompany.linkedin_url,
        
        industry: rawCompany.industry,
        size: rawCompany.size ? {
          range: rawCompany.size.range || rawCompany.size,
          exact: rawCompany.size.employees || this.parseEmployeeCount(rawCompany.size)
        } : undefined,
        founded: rawCompany.founded ? parseInt(String(rawCompany.founded)) : undefined,
        headquarters: rawCompany.headquarters || rawCompany.location,
        
        type: rawCompany.type || rawCompany.companyType,
        specialties: rawCompany.specialties || [],
        revenue: rawCompany.revenue,
        
        scrapedAt: new Date(),
        dataSource: 'apify-harvest',
        confidence: rawCompany.confidence || 0.7
      };
      
      console.log('[CompanyScraper] Successfully scraped company via Apify Harvest:', companyData.name);
      return companyData;
      
    } catch (error) {
      console.error('[CompanyScraper] Error scraping company via Apify Harvest:', error);
      
      // Return minimal data on error
      return {
        name: domain,
        domain,
        scrapedAt: new Date(),
        dataSource: 'apify-harvest',
        confidence: 0
      };
    }
  }
  
  
  /**
   * Scrape company data by LinkedIn URL using Apify + Harvest actors
   * @param linkedinUrl Company LinkedIn URL
   * @returns Structured company data
   */
  async scrapeByLinkedIn(linkedinUrl: string): Promise<CompanyData> {
    try {
      await this.enforceRateLimit();
      
      // Validate LinkedIn URL
      if (!this.isValidLinkedInCompanyUrl(linkedinUrl)) {
        throw new Error('Invalid LinkedIn company URL');
      }
      
      console.log('[CompanyScraper] Starting Apify Harvest LinkedIn company scrape:', linkedinUrl);
      
      // Try Harvest LinkedIn company actor
      let results: ApifyRunOutput[];
      try {
        console.log('[CompanyScraper] Using Harvest LinkedIn company actor:', APIFY_ACTORS.HARVEST_LINKEDIN_COMPANY);
        results = await apifyClient.scrape(APIFY_ACTORS.HARVEST_LINKEDIN_COMPANY, {
          companyUrls: [linkedinUrl],
          includeDetails: true
        });
      } catch (harvestError) {
        console.warn('[CompanyScraper] Harvest LinkedIn company actor failed, trying fallback:', harvestError);
        // Fallback to alternative company scraper
        results = await apifyClient.scrape(APIFY_ACTORS.LINKEDIN_COMPANY_FALLBACK, {
          startUrls: [{ url: linkedinUrl }]
        });
      }
      
      if (!results || results.length === 0) {
        throw new Error('No data returned from LinkedIn company scraper');
      }
      
      const rawCompany = results[0];
      
      // Transform Apify/Harvest result to our standard format
      const companyData: CompanyData = {
        name: rawCompany.name || rawCompany.companyName || 'Unknown Company',
        domain: rawCompany.domain || this.extractDomainFromUrl(rawCompany.website),
        description: rawCompany.description || rawCompany.about,
        logo: rawCompany.logo || rawCompany.logoUrl,
        website: rawCompany.website,
        linkedinUrl,
        
        industry: rawCompany.industry,
        size: rawCompany.size ? {
          range: rawCompany.size.range || rawCompany.companySize,
          exact: rawCompany.size.employees || this.parseEmployeeCount(rawCompany.companySize)
        } : undefined,
        founded: rawCompany.founded ? parseInt(String(rawCompany.founded)) : undefined,
        headquarters: rawCompany.headquarters,
        
        type: rawCompany.type || rawCompany.companyType,
        specialties: rawCompany.specialties || [],
        
        scrapedAt: new Date(),
        dataSource: 'apify-harvest',
        confidence: rawCompany.confidence || 0.8
      };
      
      console.log('[CompanyScraper] Successfully scraped LinkedIn company via Apify Harvest:', companyData.name);
      return companyData;
      
    } catch (error) {
      console.error('[CompanyScraper] Error scraping company by LinkedIn via Apify Harvest:', error);
      
      return {
        name: 'Unknown',
        linkedinUrl,
        scrapedAt: new Date(),
        dataSource: 'apify-harvest',
        confidence: 0
      };
    }
  }
  
  
  /**
   * Validate LinkedIn company URL format
   */
  private isValidLinkedInCompanyUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname.includes('linkedin.com') && 
             (parsed.pathname.includes('/company/') || parsed.pathname.includes('/school/'));
    } catch {
      return false;
    }
  }
  
  /**
   * Extract domain from URL
   */
  private extractDomainFromUrl(url: string): string | undefined {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }
  
  /**
   * Parse employee count from size range
   */
  private parseEmployeeCount(sizeRange: string): number | undefined {
    if (!sizeRange) return undefined;
    
    // Extract numbers from ranges like "1,001-5,000 employees"
    const match = sizeRange.match(/(\d{1,3}(?:,\d{3})*)-(\d{1,3}(?:,\d{3})*)/);
    if (match) {
      const min = parseInt(match[1].replace(/,/g, ''));
      const max = parseInt(match[2].replace(/,/g, ''));
      return Math.floor((min + max) / 2); // Return average
    }
    
    // Single number like "1,234 employees"
    const singleMatch = sizeRange.match(/(\d{1,3}(?:,\d{3})*)/);
    if (singleMatch) {
      return parseInt(singleMatch[1].replace(/,/g, ''));
    }
    
    return undefined;
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
          dataSource: 'apify-harvest',
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
      dataSource: 'apify-harvest',
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

// Export singleton instance (uses Apify + Harvest actors)
export const companyScraper = new CompanyScraper();