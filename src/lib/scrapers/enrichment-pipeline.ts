import { ProfileScraper, LinkedInProfile } from './profile-scraper';
import { CompanyScraper, CompanyData } from './company-scraper';
import { prisma } from '@/lib/prisma';

export interface EnrichedUserData {
  // User identification
  userId: string;
  email?: string;
  linkedinUrl?: string;
  
  // Profile data from scraping
  profile: LinkedInProfile;
  
  // Company data for current and past companies
  companies: CompanyData[];
  
  // Extracted relationships
  professionalNetwork: Array<{
    name: string;
    title: string;
    company: string;
    relationship: 'colleague' | 'manager' | 'report' | 'peer';
    strength: number; // 0-1
  }>;
  
  // Aggregated insights
  insights: {
    totalExperience: number; // years
    companiesWorked: number;
    industriesExperienced: string[];
    topSkills: string[];
    careerTrajectory: 'ascending' | 'lateral' | 'pivoting';
    networkSize: number;
    currentRole?: {
      title: string;
      company: string;
      duration: number; // months
    };
  };
  
  // Enrichment metadata
  enrichedAt: Date;
  enrichmentDuration: number; // milliseconds
  dataCompleteness: number; // 0-1
  sources: string[];
}

export class EnrichmentPipeline {
  private profileScraper: ProfileScraper;
  private companyScraper: CompanyScraper;
  private maxConcurrency: number = 3;
  
  constructor() {
    this.profileScraper = new ProfileScraper();
    this.companyScraper = new CompanyScraper();
  }
  
  /**
   * Enrich user data during registration
   * @param userId User ID from Clerk
   * @param linkedinUrl LinkedIn profile URL
   * @param email User email (optional, for company domain extraction)
   * @returns Enriched user data
   */
  async enrichUserProfile(
    userId: string, 
    linkedinUrl?: string,
    email?: string
  ): Promise<EnrichedUserData> {
    const startTime = Date.now();
    console.log('[EnrichmentPipeline] Starting enrichment for user:', userId);
    
    try {
      // Step 1: Scrape LinkedIn profile if URL provided
      let profile: LinkedInProfile | null = null;
      if (linkedinUrl) {
        profile = await this.profileScraper.scrapeProfile(linkedinUrl);
      }
      
      // Step 2: Extract companies from profile
      const companiesToScrape = this.extractCompanies(profile, email);
      
      // Step 3: Scrape company data in parallel (with concurrency limit)
      const companies = await this.scrapeCompaniesWithLimit(companiesToScrape);
      
      // Step 4: Extract professional network (placeholder for now)
      const professionalNetwork = this.extractProfessionalNetwork(profile);
      
      // Step 5: Generate insights
      const insights = this.generateInsights(profile, companies);
      
      // Step 6: Store enriched data in database
      await this.storeEnrichedData(userId, profile, companies, insights);
      
      const enrichmentDuration = Date.now() - startTime;
      console.log(`[EnrichmentPipeline] Enrichment completed in ${enrichmentDuration}ms`);
      
      return {
        userId,
        email,
        linkedinUrl,
        profile: profile || this.createEmptyProfile(linkedinUrl || ''),
        companies,
        professionalNetwork,
        insights,
        enrichedAt: new Date(),
        enrichmentDuration,
        dataCompleteness: this.calculateCompleteness(profile, companies),
        sources: this.getDataSources(profile, companies)
      };
      
    } catch (error) {
      console.error('[EnrichmentPipeline] Enrichment error:', error);
      
      // Return partial data on error
      return {
        userId,
        email,
        linkedinUrl,
        profile: this.createEmptyProfile(linkedinUrl || ''),
        companies: [],
        professionalNetwork: [],
        insights: this.generateEmptyInsights(),
        enrichedAt: new Date(),
        enrichmentDuration: Date.now() - startTime,
        dataCompleteness: 0,
        sources: []
      };
    }
  }
  
  /**
   * Extract companies to scrape from profile and email
   */
  private extractCompanies(
    profile: LinkedInProfile | null, 
    email?: string
  ): string[] {
    const companies = new Set<string>();
    
    // Extract from current position
    if (profile?.currentPosition?.company) {
      companies.add(profile.currentPosition.company);
    }
    
    // Extract from experience
    profile?.experience?.forEach(exp => {
      if (exp.company) {
        companies.add(exp.company);
      }
    });
    
    // Extract from email domain
    if (email) {
      const domain = CompanyScraper.extractDomainFromEmail(email);
      if (domain && CompanyScraper.isValidDomain(domain)) {
        companies.add(domain);
      }
    }
    
    return Array.from(companies);
  }
  
  /**
   * Scrape companies with concurrency limit
   */
  private async scrapeCompaniesWithLimit(
    companyIdentifiers: string[]
  ): Promise<CompanyData[]> {
    const results: CompanyData[] = [];
    
    // Process in batches to respect concurrency limit
    for (let i = 0; i < companyIdentifiers.length; i += this.maxConcurrency) {
      const batch = companyIdentifiers.slice(i, i + this.maxConcurrency);
      const batchPromises = batch.map(identifier => {
        // Determine if it's a domain or company name
        if (CompanyScraper.isValidDomain(identifier)) {
          return this.companyScraper.scrapeByDomain(identifier);
        } else {
          // For company names, we'd need to search first
          // For now, create placeholder data
          return Promise.resolve({
            name: identifier,
            scrapedAt: new Date(),
            dataSource: 'manual' as const,
            confidence: 0.5
          });
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * Extract professional network from profile
   * This is a placeholder - real implementation would use Neo4j
   */
  private extractProfessionalNetwork(
    profile: LinkedInProfile | null
  ): EnrichedUserData['professionalNetwork'] {
    // In real implementation, this would:
    // 1. Query Neo4j for people at same companies
    // 2. Analyze overlap periods
    // 3. Determine relationship types
    // 4. Calculate relationship strength
    
    return [];
  }
  
  /**
   * Generate insights from profile and company data
   */
  private generateInsights(
    profile: LinkedInProfile | null,
    companies: CompanyData[]
  ): EnrichedUserData['insights'] {
    const insights: EnrichedUserData['insights'] = {
      totalExperience: 0,
      companiesWorked: 0,
      industriesExperienced: [],
      topSkills: [],
      careerTrajectory: 'lateral',
      networkSize: 0
    };
    
    if (!profile) return insights;
    
    // Calculate total experience
    if (profile.experience) {
      insights.companiesWorked = profile.experience.length;
      insights.totalExperience = this.calculateTotalExperience(profile.experience);
    }
    
    // Extract industries
    const industries = new Set<string>();
    companies.forEach(company => {
      if (company.industry) {
        industries.add(company.industry);
      }
    });
    insights.industriesExperienced = Array.from(industries);
    
    // Extract top skills
    if (profile.skills) {
      insights.topSkills = profile.skills
        .sort((a, b) => (b.endorsements || 0) - (a.endorsements || 0))
        .slice(0, 10)
        .map(skill => skill.name);
    }
    
    // Determine career trajectory
    insights.careerTrajectory = this.analyzeCareerTrajectory(profile.experience);
    
    // Current role
    if (profile.currentPosition) {
      insights.currentRole = {
        title: profile.currentPosition.title,
        company: profile.currentPosition.company,
        duration: this.calculateDuration(profile.currentPosition.startDate)
      };
    }
    
    return insights;
  }
  
  /**
   * Store enriched data in database
   */
  private async storeEnrichedData(
    userId: string,
    profile: LinkedInProfile | null,
    companies: CompanyData[],
    insights: EnrichedUserData['insights']
  ): Promise<void> {
    try {
      // TODO: Store enrichment data in dedicated enrichment table
      // Currently disabled due to missing metadata field in User schema
      // await prisma.user.update({
      //   where: { id: userId },
      //   data: {
      //     metadata: {
      //       enrichment: {
      //         profile: profile ? {
      //           name: profile.name,
      //           headline: profile.headline,
      //           location: profile.location,
      //           skills: profile.skills?.map(s => s.name),
      //           profilePicture: profile.profilePicture
      //         } : null,
      //         companies: companies.map(c => ({
      //           name: c.name,
      //           domain: c.domain,
      //           industry: c.industry,
      //           size: c.size?.range
      //         })),
      //         insights,
      //         enrichedAt: new Date()
      //       }
      //     }
      //   }
      // });
      
      console.log('[EnrichmentPipeline] Enrichment data ready for user:', userId);
    } catch (error) {
      console.error('[EnrichmentPipeline] Error storing enrichment data:', error);
    }
  }
  
  // Helper methods
  
  private createEmptyProfile(linkedinUrl: string): LinkedInProfile {
    return {
      name: 'Unknown',
      profileUrl: linkedinUrl,
      scrapedAt: new Date(),
      isComplete: false
    };
  }
  
  private generateEmptyInsights(): EnrichedUserData['insights'] {
    return {
      totalExperience: 0,
      companiesWorked: 0,
      industriesExperienced: [],
      topSkills: [],
      careerTrajectory: 'lateral',
      networkSize: 0
    };
  }
  
  private calculateCompleteness(
    profile: LinkedInProfile | null,
    companies: CompanyData[]
  ): number {
    if (!profile) return 0;
    
    let score = 0;
    const weights = {
      name: 0.1,
      headline: 0.1,
      about: 0.1,
      experience: 0.3,
      education: 0.1,
      skills: 0.2,
      companies: 0.1
    };
    
    if (profile.name && profile.name !== 'Unknown') score += weights.name;
    if (profile.headline) score += weights.headline;
    if (profile.about) score += weights.about;
    if (profile.experience && profile.experience.length > 0) score += weights.experience;
    if (profile.education && profile.education.length > 0) score += weights.education;
    if (profile.skills && profile.skills.length > 0) score += weights.skills;
    if (companies.length > 0) score += weights.companies;
    
    return Math.min(score, 1);
  }
  
  private getDataSources(
    profile: LinkedInProfile | null,
    companies: CompanyData[]
  ): string[] {
    const sources = new Set<string>();
    
    if (profile?.isComplete) {
      sources.add('linkedin');
    }
    
    companies.forEach(company => {
      sources.add(company.dataSource);
    });
    
    return Array.from(sources);
  }
  
  private calculateTotalExperience(
    experiences: LinkedInProfile['experience']
  ): number {
    if (!experiences) return 0;
    
    let totalMonths = 0;
    experiences.forEach(exp => {
      if (exp.startDate) {
        const start = new Date(exp.startDate);
        const end = exp.endDate ? new Date(exp.endDate) : new Date();
        const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
        totalMonths += Math.max(0, months);
      }
    });
    
    return Math.round(totalMonths / 12);
  }
  
  private calculateDuration(startDate?: string): number {
    if (!startDate) return 0;
    
    const start = new Date(startDate);
    const now = new Date();
    const months = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    return Math.round(Math.max(0, months));
  }
  
  private analyzeCareerTrajectory(
    experiences?: LinkedInProfile['experience']
  ): 'ascending' | 'lateral' | 'pivoting' {
    if (!experiences || experiences.length < 2) return 'lateral';
    
    // Simple heuristic - can be made more sophisticated
    // Look at job titles for seniority progression
    const seniorityKeywords = ['senior', 'lead', 'principal', 'director', 'vp', 'president', 'chief'];
    
    let seniorityScores = experiences.map(exp => {
      const title = exp.title.toLowerCase();
      let score = 0;
      seniorityKeywords.forEach((keyword, index) => {
        if (title.includes(keyword)) {
          score = index + 1;
        }
      });
      return score;
    });
    
    // Check if generally increasing
    let ascending = 0;
    for (let i = 1; i < seniorityScores.length; i++) {
      if (seniorityScores[i] > seniorityScores[i - 1]) ascending++;
    }
    
    if (ascending > seniorityScores.length / 2) return 'ascending';
    
    // Check for industry changes (pivoting)
    // This would need company data to be more accurate
    
    return 'lateral';
  }
}

// Export singleton instance
export const enrichmentPipeline = new EnrichmentPipeline();