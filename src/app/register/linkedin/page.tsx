'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignUp, useUser } from '@clerk/nextjs';
import { 
  Linkedin, 
  Loader2, 
  Sparkles, 
  Network, 
  TrendingUp,
  Brain,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface ScrapedProfile {
  name?: string;
  headline?: string;
  location?: string;
  about?: string;
  experience?: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    location?: string;
  }>;
  education?: Array<{
    school: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: string[];
  profilePicture?: string;
}

function generateTrinityInsights(profile: ScrapedProfile, enrichedData: any) {
  const hasLeadershipExp = profile.experience?.some(exp => 
    exp.title.toLowerCase().includes('lead') || 
    exp.title.toLowerCase().includes('manager') ||
    exp.title.toLowerCase().includes('director') ||
    exp.title.toLowerCase().includes('senior')
  );

  const techSkills = profile.skills?.filter(skill => 
    ['javascript', 'python', 'react', 'node', 'aws', 'docker', 'typescript'].some(tech => 
      skill.toLowerCase().includes(tech)
    )
  );

  const yearsExperience = profile.experience?.length || 0;
  const hasCompany = enrichedData.company != null;

  let quest = "Building and creating meaningful impact through technology";
  let service = "Delivering innovative solutions and continuous learning";
  let pledge = "To pursue excellence while maintaining integrity and helping others grow";

  // Customize based on experience level and skills
  if (hasLeadershipExp && yearsExperience > 3) {
    quest = hasCompany 
      ? `Leading teams at ${enrichedData.company.name} to build products that transform industries`
      : "Building and empowering teams to create products that transform industries and improve lives";
    service = "Technical leadership, strategic thinking, and mentoring the next generation of innovators";
  } else if (techSkills && techSkills.length > 3) {
    quest = "Mastering cutting-edge technologies to solve complex problems and push boundaries";
    service = `Deep expertise in ${techSkills.slice(0, 3).join(', ')} with focus on collaborative innovation`;
  } else if (yearsExperience > 5) {
    quest = "Leveraging diverse experience to drive meaningful change and business impact";
    service = "Cross-functional expertise and strategic problem-solving";
  }

  return { quest, service, pledge };
}

export default function LinkedInRegistrationPage() {
  const router = useRouter();
  const { signUp, isLoaded: signUpLoaded, setActive } = useSignUp();
  const { user } = useUser();
  const [step, setStep] = useState<'linkedin' | 'scraping' | 'preview' | 'complete'>('linkedin');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scrapedData, setScrapedData] = useState<ScrapedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trinityInsights, setTrinityInsights] = useState<any>(null);

  const handleLinkedInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setStep('scraping');

    try {
      // Start LinkedIn scraping using the enhanced registration endpoint
      const scrapeResponse = await fetch('/api/register/enhanced-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          linkedinUrl,
          companyUrl: companyUrl || undefined
        })
      });

      if (!scrapeResponse.ok) {
        throw new Error('Failed to scrape LinkedIn profile');
      }

      const { enrichedData } = await scrapeResponse.json();
      
      // Transform the enhanced response to match our interface
      const profile: ScrapedProfile = {
        name: enrichedData.profile.name,
        headline: enrichedData.profile.headline,
        location: enrichedData.profile.location,
        about: enrichedData.profile.about,
        profilePicture: enrichedData.profile.profilePicture,
        skills: enrichedData.profile.skills || enrichedData.insights.topSkills,
        experience: enrichedData.profile.experience || [],
        education: enrichedData.profile.education || []
      };
      
      setScrapedData(profile);
      
      // Generate Trinity insights based on profile data
      const insights = generateTrinityInsights(profile, enrichedData);
      setTrinityInsights(insights);
      
      // Create Clerk account
      if (signUpLoaded && signUp) {
        const result = await signUp.create({
          emailAddress: email,
          password: password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          setStep('preview');
        }
      }
    } catch (err: any) {
      setError(err.message);
      setStep('linkedin');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmProfile = async () => {
    if (!user || !scrapedData) return;

    setLoading(true);
    try {
      // For now, just redirect to visualization
      // In a full implementation, we'd save the profile data
      setStep('complete');
      
      // Redirect to visualization after 3 seconds
      setTimeout(() => {
        router.push('/visualization/3d/my-trinity');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Join Quest with LinkedIn
          </h1>
          <p className="text-xl text-gray-400">
            See your professional journey in a whole new dimension
          </p>
        </div>

        {/* LinkedIn Input Step */}
        {step === 'linkedin' && (
          <div className="max-w-md mx-auto">
            <form onSubmit={handleLinkedInSubmit} className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Linkedin className="w-8 h-8 text-blue-500" />
                  <h2 className="text-2xl font-semibold">Import Your Profile</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Company Website or LinkedIn URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      placeholder="https://yourcompany.com or https://linkedin.com/company/yourcompany"
                      className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We&apos;ll enrich your company data or create a new company profile
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-4">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Import & Register
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>Already have an account?</p>
              <Link href="/sign-in" className="text-blue-400 hover:text-blue-300">
                Sign in here
              </Link>
            </div>
          </div>
        )}

        {/* Scraping Animation Step */}
        {step === 'scraping' && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-gray-800 rounded-lg p-12">
              <div className="space-y-8">
                <div className="animate-pulse">
                  <Network className="w-20 h-20 mx-auto text-blue-500" />
                </div>
                
                <h2 className="text-3xl font-bold">
                  Analyzing Your Professional Journey
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Extracting career experiences</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Mapping skill relationships</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                    <span>Generating Trinity insights...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Preview Step */}
        {step === 'preview' && scrapedData && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Your Quest Profile Preview</h2>
              
              {/* Basic Info */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  Professional Identity
                </h3>
                <div className="bg-gray-700 rounded p-4 space-y-2">
                  <p><strong>Name:</strong> {scrapedData.name || 'Quest Professional'}</p>
                  <p><strong>Headline:</strong> {scrapedData.headline || 'Professional on a quest'}</p>
                  <p><strong>Location:</strong> {scrapedData.location || 'Global'}</p>
                </div>
              </div>

              {/* Trinity Insights */}
              {trinityInsights && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    Trinity Analysis
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded p-4">
                      <h4 className="font-medium mb-2">Quest</h4>
                      <p className="text-sm">{trinityInsights.quest}</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-900 to-purple-700 rounded p-4">
                      <h4 className="font-medium mb-2">Service</h4>
                      <p className="text-sm">{trinityInsights.service}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900 to-green-700 rounded p-4">
                      <h4 className="font-medium mb-2">Pledge</h4>
                      <p className="text-sm">{trinityInsights.pledge}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Information */}
              {companyUrl && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5 text-orange-500" />
                    Company Information
                  </h3>
                  <div className="bg-gray-700 rounded p-4">
                    <p><strong>Company URL:</strong> {companyUrl}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      We&apos;ll enrich this company data and connect it to your professional network
                    </p>
                  </div>
                </div>
              )}

              {/* Skills */}
              {scrapedData.skills && scrapedData.skills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Core Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {scrapedData.skills.slice(0, 10).map((skill, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-gray-700 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {scrapedData.skills.length > 10 && (
                      <span className="px-3 py-1 text-gray-500 text-sm">
                        +{scrapedData.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('linkedin')}
                  className="flex-1 px-6 py-3 bg-gray-700 rounded hover:bg-gray-600"
                >
                  Start Over
                </button>
                <button
                  onClick={handleConfirmProfile}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Complete Registration
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === 'complete' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-gray-800 rounded-lg p-12">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Welcome to Quest!</h2>
              <p className="text-gray-400 mb-8">
                Your professional journey visualization is ready
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to your Trinity visualization...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}