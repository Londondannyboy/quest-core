// Export all scraper functionality
export { ProfileScraper, profileScraper } from './profile-scraper';
export type { LinkedInProfile } from './profile-scraper';

export { CompanyScraper, companyScraper } from './company-scraper';
export type { CompanyData, HarvestApiResponse } from './company-scraper';

export { EnrichmentPipeline, enrichmentPipeline } from './enrichment-pipeline';
export type { EnrichedUserData } from './enrichment-pipeline';

// Utility functions
export { extractLinkedInUsername, buildLinkedInUrl } from './utils';

// Rate limiting configuration
export const SCRAPING_CONFIG = {
  maxConcurrency: 3,
  rateLimitDelay: 2000, // 2 seconds between requests
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
  respectRobotsTxt: true,
  userAgent: 'Quest Core Professional Enrichment Bot 1.0'
};