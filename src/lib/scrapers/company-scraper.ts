import { harvestClient, HarvestCompanyData } from './harvest-client';

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
  dataSource: 'harvest' | 'clearbit' | 'manual' | 'apify';
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
    // Harvest client is initialized as singleton with HARVEST_API_KEY
  }
  
  /**
   * Scrape company data by domain using Harvest API
   * @param domain Company domain (e.g., "google.com")
   * @returns Structured company data
   */
  async scrapeByDomain(domain: string): Promise<CompanyData> {
    try {
      // Enforce rate limiting
      await this.enforceRateLimit();
      
      // Clean domain
      const cleanDomain = this.cleanDomain(domain);
      
      console.log('[CompanyScraper] Starting Harvest API company scrape for:', cleanDomain);
      
      // Use Harvest API to scrape company data
      const harvestCompany = await harvestClient.scrapeCompanyByDomain(cleanDomain);
      
      // Convert Harvest company to our standard format
      const companyData: CompanyData = {
        name: harvestCompany.name,
        domain: harvestCompany.domain,
        description: harvestCompany.description,
        logo: harvestCompany.logo,
        website: harvestCompany.website,
        linkedinUrl: harvestCompany.linkedinUrl,
        
        industry: harvestCompany.industry,
        size: harvestCompany.size,
        founded: harvestCompany.founded,
        headquarters: harvestCompany.headquarters,
        
        type: harvestCompany.type,
        specialties: harvestCompany.specialties,
        revenue: harvestCompany.revenue,
        
        scrapedAt: harvestCompany.scrapedAt,
        dataSource: 'harvest',
        confidence: harvestCompany.confidence
      };
      
      console.log('[CompanyScraper] Successfully scraped company via Harvest API:', companyData.name);
      return companyData;
      
    } catch (error) {
      console.error('[CompanyScraper] Error scraping company via Harvest API:', error);
      
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
   * Parse Apify company data into structured format
   */
  private parseApifyCompanyData(apifyData: ApifyRunOutput, domain: string): CompanyData {
    try {
      console.log('[CompanyScraper] Parsing Apify company data:', JSON.stringify(apifyData, null, 2));
      
      // Extract company name from various sources
      let companyName = domain;
      if (apifyData.title) {
        companyName = apifyData.title.replace(/\s*-\s*.*$/, '').trim(); // Remove taglines
      }
      
      // Look for better company names in the scraped content
      if (apifyData.companyInfo) {
        const infoValues = Object.values(apifyData.companyInfo);
        for (const value of infoValues) {
          if (typeof value === 'string' && value.length > 0 && value.length < 100) {
            // Prefer shorter, cleaner company names
            if (!companyName || value.length < companyName.length) {
              companyName = value;
            }
          }
        }
      }
      
      return {
        name: companyName,
        domain,
        description: apifyData.description || '',
        website: apifyData.url || `https://${domain}`,
        
        // Extract from metadata if available
        specialties: apifyData.keywords ? apifyData.keywords.split(',').map((k: string) => k.trim()) : [],
        
        // Metadata
        scrapedAt: new Date(),
        dataSource: 'apify',
        confidence: apifyData.title ? 0.8 : 0.3, // Higher confidence if we got a title
      };
      
    } catch (error) {
      console.error('[CompanyScraper] Error parsing Apify company data:', error);
      return {
        name: domain,
        domain,
        scrapedAt: new Date(),
        dataSource: 'apify',
        confidence: 0
      };
    }
  }
  
  /**
   * Scrape company data by LinkedIn URL using Harvest API
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
      
      console.log('[CompanyScraper] Starting Harvest API LinkedIn company scrape:', linkedinUrl);
      
      // Use Harvest API to scrape LinkedIn company data
      const harvestCompany = await harvestClient.scrapeCompanyByLinkedIn(linkedinUrl);
      
      // Convert Harvest company to our standard format
      const companyData: CompanyData = {
        name: harvestCompany.name,
        domain: harvestCompany.domain,
        description: harvestCompany.description,
        logo: harvestCompany.logo,
        website: harvestCompany.website,
        linkedinUrl: harvestCompany.linkedinUrl,
        
        industry: harvestCompany.industry,
        size: harvestCompany.size,
        founded: harvestCompany.founded,
        headquarters: harvestCompany.headquarters,
        
        type: harvestCompany.type,
        specialties: harvestCompany.specialties,
        revenue: harvestCompany.revenue,
        
        scrapedAt: harvestCompany.scrapedAt,
        dataSource: 'harvest',
        confidence: harvestCompany.confidence
      };
      
      console.log('[CompanyScraper] Successfully scraped LinkedIn company via Harvest API:', companyData.name);
      return companyData;
      
    } catch (error) {
      console.error('[CompanyScraper] Error scraping company by LinkedIn via Harvest API:', error);
      
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
   * Parse Apify LinkedIn company data into structured format
   */
  private parseApifyLinkedInCompanyData(apifyData: ApifyRunOutput, linkedinUrl: string): CompanyData {
    try {
      console.log('[CompanyScraper] Parsing Apify LinkedIn company data:', JSON.stringify(apifyData, null, 2));
      
      return {
        name: apifyData.companyName || apifyData.name || 'Unknown',
        domain: apifyData.website ? this.extractDomainFromUrl(apifyData.website) : undefined,
        description: apifyData.description || apifyData.about,
        logo: apifyData.logo || apifyData.logoUrl,
        website: apifyData.website,
        linkedinUrl,
        
        // Company details
        industry: apifyData.industry,
        size: apifyData.companySize ? {
          range: apifyData.companySize,
          exact: this.parseEmployeeCount(apifyData.companySize)
        } : undefined,
        founded: apifyData.founded ? parseInt(apifyData.founded) : undefined,
        headquarters: apifyData.headquarters ? {
          city: apifyData.headquarters.city,
          state: apifyData.headquarters.state,
          country: apifyData.headquarters.country,
          address: apifyData.headquarters.address
        } : undefined,
        
        // Business information
        type: apifyData.companyType,
        specialties: apifyData.specialties || [],
        
        // Metadata
        scrapedAt: new Date(),
        dataSource: 'apify',
        confidence: 0.9, // High confidence for LinkedIn data
      };
      
    } catch (error) {
      console.error('[CompanyScraper] Error parsing Apify LinkedIn company data:', error);
      return {
        name: 'Unknown',
        linkedinUrl,
        scrapedAt: new Date(),
        dataSource: 'apify',
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

// Export singleton instance (no API key needed - uses Apify client)
export const companyScraper = new CompanyScraper();