'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function TestScrapingPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/in/dankeegan/');
  const [email, setEmail] = useState('admin@questcore.com');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!linkedinUrl.trim()) {
      setError('Please enter a LinkedIn URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting scraping test for:', linkedinUrl);
      
      const response = await fetch('/api/test-scraping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim(),
          email: email.trim(),
          testMode: true
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data);
      console.log('Scraping result:', data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Scraping error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Apify Scraping Test</h1>
          <p className="text-gray-600 mt-1">Test LinkedIn profile scraping with Apify integration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Enter a LinkedIn profile URL to test the Apify scraping integration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
              <Input
                id="linkedin-url"
                type="url"
                placeholder="https://www.linkedin.com/in/username/"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (for enrichment context)</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleTest} 
              disabled={isLoading || !linkedinUrl.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing Scraping... (1-2 minutes)
                </>
              ) : (
                'Test LinkedIn Scraping'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Scraped data will appear here after the test completes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">
                    Apify is scraping the LinkedIn profile...
                    <br />
                    This typically takes 1-2 minutes
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-semibold mb-2">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            {result && (
              <div className="space-y-4">
                {result.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-green-800 font-semibold mb-2">✅ Success!</h4>
                    <div className="text-sm text-green-700">
                      <p>Profile scraped in {result.totalTime}ms</p>
                      {result.enrichedData?.profile && (
                        <div className="mt-3 space-y-1">
                          <p><strong>Name:</strong> {result.enrichedData.profile.name}</p>
                          <p><strong>Headline:</strong> {result.enrichedData.profile.headline}</p>
                          <p><strong>Location:</strong> {result.enrichedData.profile.location}</p>
                          <p><strong>Skills:</strong> {result.enrichedData.profile.skillsCount} found</p>
                          <p><strong>Experience:</strong> {result.enrichedData.profile.experienceCount} positions</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-semibold mb-2">❌ Failed</h4>
                    <p className="text-red-700 text-sm">{result.error}</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <Label htmlFor="full-result">Full Response (JSON)</Label>
                  <Textarea
                    id="full-result"
                    value={JSON.stringify(result, null, 2)}
                    readOnly
                    rows={15}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>
            )}
            
            {!isLoading && !error && !result && (
              <div className="text-center p-8 text-gray-500">
                <p>Click &quot;Test LinkedIn Scraping&quot; to start</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}