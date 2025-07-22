import { RateLimiter } from './utils';

export interface ScrapingConfig {
  maxRequestsPerMinute: number;
  respectRobotsTxt: boolean;
  userAgent: string;
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
  backoffMultiplier: number;
}

export interface ScrapingLimits {
  dailyLimit: number;
  hourlyLimit: number;
  perDomainLimit: number;
  userDailyLimit: number;
}

export class EthicalScrapingManager {
  private rateLimiter: RateLimiter;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private userRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private domainRequestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  
  private config: ScrapingConfig = {
    maxRequestsPerMinute: 30,
    respectRobotsTxt: true,
    userAgent: 'Quest Core Professional Enrichment Bot 1.0 (+https://questcore.com/bot)',
    maxConcurrentRequests: 3,
    requestTimeout: 30000,
    retryAttempts: 3,
    backoffMultiplier: 2
  };
  
  private limits: ScrapingLimits = {
    dailyLimit: 10000,
    hourlyLimit: 1000,
    perDomainLimit: 100,
    userDailyLimit: 50 // Per user per day
  };
  
  constructor(config?: Partial<ScrapingConfig>, limits?: Partial<ScrapingLimits>) {
    this.config = { ...this.config, ...config };
    this.limits = { ...this.limits, ...limits };
    
    // Create rate limiter with per-minute limit converted to milliseconds
    const delayMs = (60 * 1000) / this.config.maxRequestsPerMinute;
    this.rateLimiter = new RateLimiter(delayMs);
  }
  
  /**
   * Check if scraping request is allowed under ethical guidelines
   */
  async checkScrapingPermission(
    url: string,
    userId?: string
  ): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    try {
      const domain = this.extractDomain(url);
      
      // Check domain limits
      if (!this.checkDomainLimit(domain)) {
        return {
          allowed: false,
          reason: `Domain ${domain} has reached daily scraping limit (${this.limits.perDomainLimit})`
        };
      }
      
      // Check user limits
      if (userId && !this.checkUserLimit(userId)) {
        return {
          allowed: false,
          reason: `User has reached daily scraping limit (${this.limits.userDailyLimit})`
        };
      }
      
      // Check global limits
      if (!this.checkGlobalLimits()) {
        return {
          allowed: false,
          reason: 'Global scraping limits reached for today'
        };
      }
      
      // Check robots.txt if enabled
      if (this.config.respectRobotsTxt) {
        const robotsAllowed = await this.checkRobotsTxt(url);
        if (!robotsAllowed) {
          return {
            allowed: false,
            reason: 'Scraping not allowed by robots.txt'
          };
        }
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('[EthicalScraping] Permission check error:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }
  
  /**
   * Execute scraping request with ethical controls
   */
  async executeScrapingRequest<T>(
    url: string,
    scrapingFunction: () => Promise<T>,
    userId?: string
  ): Promise<T> {
    // Check permission first
    const permission = await this.checkScrapingPermission(url, userId);
    if (!permission.allowed) {
      throw new Error(`Scraping not allowed: ${permission.reason}`);
    }
    
    const domain = this.extractDomain(url);
    
    try {
      // Enforce rate limiting
      await this.rateLimiter.enforceRateLimit(`domain:${domain}`);
      
      // Track requests
      this.incrementRequestCount(domain, userId);
      
      // Execute with timeout
      const result = await Promise.race([
        scrapingFunction(),
        this.createTimeout(this.config.requestTimeout)
      ]);
      
      console.log(`[EthicalScraping] Successfully scraped: ${url}`);
      return result;
      
    } catch (error) {
      console.error(`[EthicalScraping] Error scraping ${url}:`, error);
      throw error;
    }
  }
  
  /**
   * Check robots.txt compliance
   */
  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const domain = this.extractDomain(url);
      const robotsUrl = `https://${domain}/robots.txt`;
      
      const response = await fetch(robotsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': this.config.userAgent
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout for robots.txt
      });
      
      if (!response.ok) {
        // If robots.txt doesn't exist, assume allowed
        return true;
      }
      
      const robotsContent = await response.text();
      
      // Simple robots.txt parser - can be enhanced
      const lines = robotsContent.split('\n');
      let userAgentMatches = false;
      let disallowed = false;
      
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        
        if (trimmed.startsWith('user-agent:')) {
          const agent = trimmed.substring('user-agent:'.length).trim();
          userAgentMatches = agent === '*' || 
                           this.config.userAgent.toLowerCase().includes(agent);
        } else if (userAgentMatches && trimmed.startsWith('disallow:')) {
          const path = trimmed.substring('disallow:'.length).trim();
          
          // Check if current URL path matches disallow pattern
          const urlPath = new URL(url).pathname;
          if (path === '/' || urlPath.startsWith(path)) {
            disallowed = true;
            break;
          }
        }
      }
      
      return !disallowed;
      
    } catch (error) {
      console.log('[EthicalScraping] Could not check robots.txt, allowing by default:', error);
      return true; // Default to allowing if robots.txt check fails
    }
  }
  
  /**
   * Check domain-specific limits
   */
  private checkDomainLimit(domain: string): boolean {
    const key = `domain:${domain}`;
    const now = Date.now();
    const dayStart = this.getDayStart();
    
    const domainCount = this.domainRequestCounts.get(key);
    if (!domainCount || domainCount.resetTime < dayStart) {
      this.domainRequestCounts.set(key, { count: 0, resetTime: dayStart + 24 * 60 * 60 * 1000 });
      return true;
    }
    
    return domainCount.count < this.limits.perDomainLimit;
  }
  
  /**
   * Check user-specific limits
   */
  private checkUserLimit(userId: string): boolean {
    const key = `user:${userId}`;
    const dayStart = this.getDayStart();
    
    const userCount = this.userRequestCounts.get(key);
    if (!userCount || userCount.resetTime < dayStart) {
      this.userRequestCounts.set(key, { count: 0, resetTime: dayStart + 24 * 60 * 60 * 1000 });
      return true;
    }
    
    return userCount.count < this.limits.userDailyLimit;
  }
  
  /**
   * Check global limits
   */
  private checkGlobalLimits(): boolean {
    const dayStart = this.getDayStart();
    
    const globalCount = this.requestCounts.get('global');
    if (!globalCount || globalCount.resetTime < dayStart) {
      this.requestCounts.set('global', { count: 0, resetTime: dayStart + 24 * 60 * 60 * 1000 });
      return true;
    }
    
    return globalCount.count < this.limits.dailyLimit;
  }
  
  /**
   * Increment request counters
   */
  private incrementRequestCount(domain: string, userId?: string): void {
    const dayStart = this.getDayStart();
    
    // Increment global count
    const globalCount = this.requestCounts.get('global');
    if (globalCount) {
      globalCount.count++;
    }
    
    // Increment domain count
    const domainKey = `domain:${domain}`;
    const domainCount = this.domainRequestCounts.get(domainKey);
    if (domainCount) {
      domainCount.count++;
    }
    
    // Increment user count
    if (userId) {
      const userKey = `user:${userId}`;
      const userCount = this.userRequestCounts.get(userKey);
      if (userCount) {
        userCount.count++;
      }
    }
  }
  
  /**
   * Get current usage statistics
   */
  getUsageStats(): {
    global: number;
    domains: Record<string, number>;
    users: Record<string, number>;
  } {
    const domains: Record<string, number> = {};
    const users: Record<string, number> = {};
    
    this.domainRequestCounts.forEach((value, key) => {
      if (key.startsWith('domain:')) {
        domains[key.substring(7)] = value.count;
      }
    });
    
    this.userRequestCounts.forEach((value, key) => {
      if (key.startsWith('user:')) {
        users[key.substring(5)] = value.count;
      }
    });
    
    return {
      global: this.requestCounts.get('global')?.count || 0,
      domains,
      users
    };
  }
  
  /**
   * Reset usage counters
   */
  resetUsageStats(type?: 'global' | 'domains' | 'users'): void {
    if (!type || type === 'global') {
      this.requestCounts.clear();
    }
    if (!type || type === 'domains') {
      this.domainRequestCounts.clear();
    }
    if (!type || type === 'users') {
      this.userRequestCounts.clear();
    }
  }
  
  // Utility methods
  
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url; // Fallback if URL parsing fails
    }
  }
  
  private getDayStart(): number {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return dayStart.getTime();
  }
  
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });
  }
}

// Export singleton instance
export const ethicalScrapingManager = new EthicalScrapingManager();