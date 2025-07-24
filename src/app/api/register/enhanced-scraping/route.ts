import { NextResponse } from 'next/server';
import { profileScraper } from '@/lib/scrapers/profile-scraper';

export async function POST(request: Request) {
  try {
    const { linkedinUrl, companyUrl } = await request.json();
    
    if (!linkedinUrl) {
      return NextResponse.json({ 
        error: 'LinkedIn URL is required',
        success: false 
      }, { status: 400 });
    }
    
    console.log('[Enhanced Registration Scraping] Starting for:', { linkedinUrl, companyUrl });
    
    const startTime = Date.now();
    const results: any = {
      profile: null,
      company: null,
      success: false
    };

    // Scrape LinkedIn profile
    try {
      const profile = await profileScraper.scrapeProfile(linkedinUrl);
      results.profile = profile;
      
      if (profile.isComplete) {
        results.success = true;
      }
    } catch (profileError) {
      console.error('[Enhanced Registration] Profile scraping failed:', profileError);
      results.profileError = profileError instanceof Error ? profileError.message : 'Profile scraping failed';
    }

    // Scrape/lookup company if provided
    if (companyUrl) {
      try {
        // For now, we'll create a placeholder company object
        // In a full implementation, this would use the company scraper
        results.company = {
          url: companyUrl,
          name: extractCompanyNameFromUrl(companyUrl),
          isExisting: false, // Would check database for existing company
          scraped: false // Would be true if we successfully scraped it
        };
      } catch (companyError) {
        console.error('[Enhanced Registration] Company processing failed:', companyError);
        results.companyError = companyError instanceof Error ? companyError.message : 'Company processing failed';
      }
    }

    const duration = Date.now() - startTime;

    // Return enhanced data for registration
    if (results.success) {
      const profile = results.profile;
      return NextResponse.json({
        success: true,
        registrationMode: true,
        enrichedData: {
          profile: {
            name: profile.name,
            headline: profile.headline,
            location: profile.location,
            about: profile.about,
            profilePicture: profile.profilePicture,
            skillsCount: profile.skills?.length || 0,
            experienceCount: profile.experience?.length || 0,
            educationCount: profile.education?.length || 0,
            isComplete: profile.isComplete,
            // Include full data for registration
            skills: profile.skills?.map((s: any) => typeof s === 'string' ? s : s.name) || [],
            experience: profile.experience || [],
            education: profile.education || []
          },
          company: results.company,
          insights: {
            totalExperience: profile.experience?.length || 0,
            companiesWorked: new Set(profile.experience?.map((exp: any) => exp.company)).size,
            topSkills: profile.skills?.slice(0, 5).map((s: any) => typeof s === 'string' ? s : s.name) || [],
            hasCompanyInfo: !!companyUrl
          }
        },
        totalTime: duration,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: results.profileError || 'Registration scraping failed',
        profile: results.profile ? {
          name: results.profile.name,
          error: results.profile.name?.startsWith('Error:') ? results.profile.name : 'Unknown error'
        } : null,
        company: results.company,
        duration,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Enhanced Registration] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Enhanced registration scraping failed',
      details: String(error)
    }, { status: 500 });
  }
}

function extractCompanyNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // If it's a LinkedIn company URL
    if (urlObj.hostname.includes('linkedin.com') && urlObj.pathname.includes('/company/')) {
      const companySlug = urlObj.pathname.split('/company/')[1]?.split('/')[0];
      return companySlug ? formatCompanyName(companySlug) : 'Unknown Company';
    }
    
    // If it's a regular website
    const domain = urlObj.hostname.replace(/^www\./, '');
    return formatCompanyName(domain.split('.')[0]);
  } catch {
    return 'Unknown Company';
  }
}

function formatCompanyName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}