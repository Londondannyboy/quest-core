'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestScrapingDirectPage() {
  const [linkedinUrl, setLinkedinUrl] = useState('https://www.linkedin.com/in/williamhgates/');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDirectTest = async () => {
    if (!linkedinUrl.trim()) {
      setError('Please enter a LinkedIn URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Calling working Apify server directly from frontend...');
      
      // Call your working server directly from the frontend
      const response = await fetch('https://apify-mp-mcp-server.vercel.app/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedinUrl: linkedinUrl.trim()
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setResult(data);
      console.log('Direct scraping result:', data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Direct scraping error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Direct Apify Test (Frontend Only)</h1>
          <p className="text-gray-600 mt-1">Bypasses Next.js backend - calls working server directly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Direct Frontend Test</CardTitle>
            <CardDescription>
              This calls apify-mp-mcp-server.vercel.app directly from the browser
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

            <Button 
              onClick={handleDirectTest} 
              disabled={isLoading || !linkedinUrl.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing Direct Call...
                </>
              ) : (
                'Test Direct Frontend Call'
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw Results</CardTitle>
            <CardDescription>
              Direct response from working server
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="space-y-4">
                {result.success && result.data && (
                  <>
                    <div className="p-4 bg-green-50 border border-green-200 rounded">
                      <p className="font-semibold text-green-700">✅ Success!</p>
                      <p className="text-sm text-green-600 mt-1">
                        Data received directly from working server
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {result.data.name || 'N/A'}</p>
                      <p><strong>Headline:</strong> {result.data.headline || 'N/A'}</p>
                      <p><strong>Location:</strong> {result.data.location || 'N/A'}</p>
                      {result.data.skills && (
                        <p><strong>Skills:</strong> {result.data.skills.length} found</p>
                      )}
                      {result.data.experience && (
                        <p><strong>Experience:</strong> {result.data.experience.length} positions</p>
                      )}
                    </div>
                  </>
                )}
                
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    View Full Response
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}