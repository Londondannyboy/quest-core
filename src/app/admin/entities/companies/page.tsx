'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';

interface Company {
  id: string;
  name: string;
  website?: string;
  domain?: string;
  verified: boolean;
  industry?: string;
  createdAt: string;
}

export default function CompaniesPage() {
  const { isSignedIn } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    website: '',
    industry: ''
  });

  const [customIndustry, setCustomIndustry] = useState('');
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);

  const INDUSTRY_CATEGORIES = [
    'Technology',
    'Healthcare', 
    'Finance',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Marketing & Advertising',
    'Real Estate',
    'Non-profit',
    'Government',
    'Media & Entertainment',
    'Transportation',
    'Energy',
    'Other'
  ];

  useEffect(() => {
    if (isSignedIn) {
      fetchCompanies();
    }
  }, [isSignedIn]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/entities/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/admin/entities/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompany.name.trim(),
          website: newCompany.website.trim() || undefined,
          industry: showCustomIndustry ? customIndustry.trim() : newCompany.industry || undefined
        })
      });

      if (response.ok) {
        const company = await response.json();
        setCompanies(prev => [company, ...prev]);
        setNewCompany({ name: '', website: '', industry: '' });
        setCustomIndustry('');
        setShowCustomIndustry(false);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Failed to create company: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Network error - please try again');
    } finally {
      setCreating(false);
    }
  };

  const toggleVerification = async (companyId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/admin/entities/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !verified })
      });

      if (response.ok) {
        setCompanies(prev => prev.map(company => 
          company.id === companyId 
            ? { ...company, verified: !verified }
            : company
        ));
      }
    } catch (error) {
      console.error('Error updating company verification:', error);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to access admin features.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground">Manage companies for user profiles and work experiences</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {companies.length} companies
        </Badge>
      </div>

      {/* Create Company Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Company</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createCompany} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Company Name *</label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Website</label>
                <Input
                  value={newCompany.website}
                  onChange={(e) => setNewCompany(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://company.com"
                  type="url"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                {!showCustomIndustry ? (
                  <select
                    value={newCompany.industry}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomIndustry(true);
                        setNewCompany(prev => ({ ...prev, industry: '' }));
                      } else {
                        setNewCompany(prev => ({ ...prev, industry: e.target.value }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_CATEGORIES.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                    <option value="custom">+ Create new industry</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="Enter custom industry"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCustomIndustry(false);
                        setCustomIndustry('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" disabled={creating || !newCompany.name.trim()}>
              {creating ? 'Creating...' : 'Add Company'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Companies</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading companies...</p>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No companies created yet</p>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{company.name}</h3>
                      <Badge variant={company.verified ? "default" : "secondary"}>
                        {company.verified ? "Verified" : "Unverified"}
                      </Badge>
                      {company.industry && (
                        <Badge variant="outline" className="text-xs">
                          {company.industry}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {company.website && (
                        <p>Website: <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{company.website}</a></p>
                      )}
                      {company.domain && <p>Domain: {company.domain}</p>}
                      <p>Created: {new Date(company.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVerification(company.id, company.verified)}
                  >
                    {company.verified ? 'Unverify' : 'Verify'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}