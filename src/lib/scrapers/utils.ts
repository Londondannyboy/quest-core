/**
 * Utility functions for scraping operations
 */

/**
 * Extract LinkedIn username from URL
 */
export function extractLinkedInUsername(profileUrl: string): string | null {
  const match = profileUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
  return match ? match[1] : null;
}

/**
 * Build LinkedIn profile URL from username
 */
export function buildLinkedInUrl(username: string): string {
  return `https://www.linkedin.com/in/${username}`;
}

/**
 * Clean and normalize company domain
 */
export function cleanDomain(domain: string): string {
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');
  // Remove www
  domain = domain.replace(/^www\./, '');
  // Remove trailing slash and path
  domain = domain.split('/')[0];
  // Convert to lowercase
  return domain.toLowerCase();
}

/**
 * Extract domain from email address
 */
export function extractDomainFromEmail(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
}

/**
 * Validate LinkedIn profile URL
 */
export function isValidLinkedInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('linkedin.com') && 
           parsed.pathname.includes('/in/');
  } catch {
    return false;
  }
}

/**
 * Generate cache key for scraped data
 */
export function generateCacheKey(type: 'profile' | 'company', identifier: string): string {
  return `scraper:${type}:${identifier.toLowerCase()}`;
}

/**
 * Delay execution for rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delayTime = baseDelay * Math.pow(2, attempt);
      console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delayTime}ms`);
      await delay(delayTime);
    }
  }
  
  throw lastError!;
}

/**
 * Parse date string to Date object with fallback
 */
export function parseDate(dateStr: string | undefined): Date | undefined {
  if (!dateStr) return undefined;
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/**
 * Calculate duration between two dates in months
 */
export function calculateDurationInMonths(
  startDate: string | Date | undefined,
  endDate: string | Date | undefined = new Date()
): number {
  if (!startDate) return 0;
  
  const start = typeof startDate === 'string' ? parseDate(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDate(endDate) : endDate;
  
  if (!start || !end) return 0;
  
  const months = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.round(Math.max(0, months));
}

/**
 * Normalize company name for matching
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract keywords from text
 */
export function extractKeywords(
  text: string,
  minLength: number = 3,
  maxKeywords: number = 20
): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ]);
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length >= minLength && 
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // Exclude numbers
    );
  
  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach(word => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Return top keywords by frequency
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Format duration as human readable string
 */
export function formatDuration(months: number): string {
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  let result = `${years} year${years !== 1 ? 's' : ''}`;
  if (remainingMonths > 0) {
    result += ` ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }
  
  return result;
}

/**
 * Check if rate limit should be enforced
 */
export class RateLimiter {
  private lastRequestTimes = new Map<string, number>();
  private delays = new Map<string, number>();
  
  constructor(
    private defaultDelay: number = 1000
  ) {}
  
  async enforceRateLimit(key: string, customDelay?: number): Promise<void> {
    const delay = customDelay || this.defaultDelay;
    const lastRequest = this.lastRequestTimes.get(key) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < delay) {
      const waitTime = delay - timeSinceLastRequest;
      console.log(`[RateLimit] Waiting ${waitTime}ms for key: ${key}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTimes.set(key, Date.now());
  }
  
  reset(key?: string): void {
    if (key) {
      this.lastRequestTimes.delete(key);
    } else {
      this.lastRequestTimes.clear();
    }
  }
}