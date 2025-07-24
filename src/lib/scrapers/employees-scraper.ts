import { apifyClient, APIFY_ACTORS, ApifyRunOutput } from './apify-client';

export interface CompanyEmployee {
  // Basic Information
  name: string;
  headline?: string;
  profileUrl?: string;
  profilePicture?: string;
  
  // Position at company
  position?: string;
  department?: string;
  location?: string;
  startDate?: string;
  
  // Professional info
  skills?: string[];
  connectionDegree?: number; // 1st, 2nd, 3rd degree connection
  
  // Metadata
  companyName: string;
  companyLinkedInUrl: string;
  scrapedAt: Date;
}

export interface CompanyEmployeesResult {
  companyName: string;
  companyLinkedInUrl: string;
  totalEmployees: number;
  employees: CompanyEmployee[];
  searchQuery?: string;
  scrapedAt: Date;
}

export class EmployeesScraper {
  private rateLimitDelay: number = 2000; // 2 seconds between requests
  private lastRequestTime: number = 0;
  
  constructor() {
    // Apify client is initialized as singleton with APIFY_API_KEY
  }
  
  /**
   * Scrape company employees from LinkedIn company page
   * @param companyLinkedInUrl LinkedIn company URL (e.g., https://www.linkedin.com/company/google)
   * @param searchQuery Optional search query to filter employees (e.g., "engineer", "sales")
   * @param maxItems Maximum number of employees to scrape
   * @returns Company employees data
   */
  async scrapeCompanyEmployees(
    companyLinkedInUrl: string, 
    searchQuery: string = '',
    maxItems: number = 20
  ): Promise<CompanyEmployeesResult> {
    try {
      // Respect rate limiting
      await this.enforceRateLimit();
      
      // Validate LinkedIn company URL
      if (!this.isValidLinkedInCompanyUrl(companyLinkedInUrl)) {
        throw new Error('Invalid LinkedIn company URL');
      }
      
      console.log('[EmployeesScraper] Starting company employees scrape:', companyLinkedInUrl);
      
      // Test connection first
      try {
        await apifyClient.testConnection();
        console.log('[EmployeesScraper] Apify connection verified');
      } catch (connectionError) {
        console.error('[EmployeesScraper] Apify connection failed:', connectionError);
        throw new Error(`Apify connection failed: ${connectionError}`);
      }
      
      // Use the company employees scraper task
      let results: ApifyRunOutput[];
      try {
        console.log('[EmployeesScraper] Using company employees task:', APIFY_ACTORS.HARVEST_LINKEDIN_EMPLOYEES);
        results = await apifyClient.scrape(APIFY_ACTORS.HARVEST_LINKEDIN_EMPLOYEES, {
          companies: [companyLinkedInUrl],
          searchQuery,
          maxItems,
          profileScraperMode: 'Fast' // Fast mode for employee lists
        });
      } catch (error) {
        console.error('[EmployeesScraper] Company employees scraper failed:', error);
        throw error;
      }
      
      if (!results || results.length === 0) {
        throw new Error('No data returned from company employees scraper');
      }
      
      // Transform results to our standard format
      const employees = this.parseEmployeesData(results, companyLinkedInUrl);
      
      console.log(`[EmployeesScraper] Successfully scraped ${employees.employees.length} employees`);
      return employees;
      
    } catch (error) {
      console.error('[EmployeesScraper] Error scraping company employees:', error);
      
      // Return empty result on error
      return {
        companyName: this.extractCompanyName(companyLinkedInUrl),
        companyLinkedInUrl,
        totalEmployees: 0,
        employees: [],
        searchQuery,
        scrapedAt: new Date()
      };
    }
  }
  
  /**
   * Parse employees data from Apify results
   */
  private parseEmployeesData(results: ApifyRunOutput[], companyUrl: string): CompanyEmployeesResult {
    const employees: CompanyEmployee[] = [];
    const companyName = this.extractCompanyName(companyUrl);
    
    // Process each result (could be multiple pages)
    for (const result of results) {
      // Type guard to handle array vs object results
      let profilesList: any[] = [];
      
      if (Array.isArray(result)) {
        // If result is already an array of profiles
        profilesList = result;
      } else if (result && typeof result === 'object') {
        // If result is an object with profiles or employees property
        const resultObj = result as any;
        profilesList = resultObj.profiles || resultObj.employees || [];
      }
      
      for (const profile of profilesList) {
        if (profile) {
          employees.push({
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.name || 'Unknown',
            headline: profile.headline || profile.title,
            profileUrl: profile.linkedinUrl || profile.profileUrl,
            profilePicture: profile.photo || profile.profilePicture,
            
            position: profile.position || profile.currentPosition?.title,
            department: profile.department,
            location: profile.location?.linkedinText || profile.location,
            startDate: profile.currentPosition?.startDate,
            
            skills: profile.topSkills || profile.skills?.slice(0, 5).map((s: any) => 
              typeof s === 'string' ? s : s.name
            ),
            connectionDegree: profile.connectionDegree || profile.distance,
            
            companyName,
            companyLinkedInUrl: companyUrl,
            scrapedAt: new Date()
          });
        }
      }
    }
    
    return {
      companyName,
      companyLinkedInUrl: companyUrl,
      totalEmployees: employees.length,
      employees,
      searchQuery: results[0]?.searchQuery,
      scrapedAt: new Date()
    };
  }
  
  /**
   * Validate LinkedIn company URL
   */
  private isValidLinkedInCompanyUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'www.linkedin.com' && 
             urlObj.pathname.startsWith('/company/');
    } catch {
      return false;
    }
  }
  
  /**
   * Extract company name from LinkedIn URL
   */
  private extractCompanyName(url: string): string {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');
      const companyIndex = parts.indexOf('company');
      if (companyIndex !== -1 && parts[companyIndex + 1]) {
        return parts[companyIndex + 1].replace(/-/g, ' ');
      }
    } catch {
      // Ignore
    }
    return 'Unknown Company';
  }
  
  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`[EmployeesScraper] Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
}

// Export singleton instance
export const employeesScraper = new EmployeesScraper();