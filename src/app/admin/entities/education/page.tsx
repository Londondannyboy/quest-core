'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';

interface EducationalInstitution {
  id: string;
  name: string;
  type?: 'university' | 'college' | 'community_college' | 'trade_school' | 'bootcamp' | 'online_platform' | 'other';
  country?: string;
  website?: string;
  verified: boolean;
  createdAt: string;
  _count?: {
    userEducation: number;
  };
}

const INSTITUTION_TYPES = [
  'university',
  'college', 
  'community_college',
  'trade_school',
  'bootcamp',
  'online_platform',
  'other'
];

const COUNTRIES = [
  'United States',
  'United Kingdom', 
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'Singapore',
  'Japan',
  'South Korea',
  'India',
  'Other'
];

export default function EducationPage() {
  const { isSignedIn } = useAuth();
  const [institutions, setInstitutions] = useState<EducationalInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [newInstitution, setNewInstitution] = useState({
    name: '',
    type: 'university' as const,
    country: '',
    website: ''
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchInstitutions();
    }
  }, [isSignedIn]);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/admin/entities/education');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstitution.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/admin/entities/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInstitution.name.trim(),
          type: newInstitution.type,
          country: newInstitution.country || undefined,
          website: newInstitution.website.trim() || undefined
        })
      });

      if (response.ok) {
        const institution = await response.json();
        setInstitutions(prev => [institution, ...prev]);
        setNewInstitution({ name: '', type: 'university', country: '', website: '' });
      }
    } catch (error) {
      console.error('Error creating institution:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleVerification = async (institutionId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/admin/entities/education/${institutionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !verified })
      });

      if (response.ok) {
        setInstitutions(prev => prev.map(institution => 
          institution.id === institutionId 
            ? { ...institution, verified: !verified }
            : institution
        ));
      }
    } catch (error) {
      console.error('Error updating institution verification:', error);
    }
  };

  const filteredInstitutions = filterType 
    ? institutions.filter(institution => institution.type === filterType)
    : institutions;

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'university': return 'bg-blue-100 text-blue-800';
      case 'college': return 'bg-green-100 text-green-800';
      case 'community_college': return 'bg-yellow-100 text-yellow-800';
      case 'trade_school': return 'bg-orange-100 text-orange-800';
      case 'bootcamp': return 'bg-purple-100 text-purple-800';
      case 'online_platform': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold">Educational Institutions</h1>
          <p className="text-muted-foreground">Manage educational institutions for user education profiles</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredInstitutions.length} institutions {filterType && `(${filterType.replace('_', ' ')})`}
        </Badge>
      </div>

      {/* Create Institution Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Educational Institution</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createInstitution} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Institution Name *</label>
                <Input
                  value={newInstitution.name}
                  onChange={(e) => setNewInstitution(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Stanford University, General Assembly"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <select
                  value={newInstitution.type}
                  onChange={(e) => setNewInstitution(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {INSTITUTION_TYPES.map(type => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Country</label>
                <select
                  value={newInstitution.country}
                  onChange={(e) => setNewInstitution(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Website</label>
                <Input
                  value={newInstitution.website}
                  onChange={(e) => setNewInstitution(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://university.edu"
                  type="url"
                />
              </div>
            </div>
            <Button type="submit" disabled={creating || !newInstitution.name.trim()}>
              {creating ? 'Creating...' : 'Add Institution'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Type Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('')}
            >
              All Types ({institutions.length})
            </Button>
            {INSTITUTION_TYPES.map(type => {
              const count = institutions.filter(institution => institution.type === type).length;
              if (count === 0) return null;
              return (
                <Button
                  key={type}
                  variant={filterType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType(type)}
                >
                  {type.replace('_', ' ')} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Institutions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterType ? `${filterType.replace('_', ' ')} Institutions` : 'All Educational Institutions'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading institutions...</p>
          ) : filteredInstitutions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {filterType ? `No ${filterType.replace('_', ' ')} institutions` : 'No institutions created yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredInstitutions.map((institution) => (
                <div key={institution.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{institution.name}</h3>
                      <Badge variant={institution.verified ? "default" : "secondary"}>
                        {institution.verified ? "Verified" : "Unverified"}
                      </Badge>
                      {institution.type && (
                        <Badge className={`text-xs ${getTypeColor(institution.type)}`}>
                          {institution.type.replace('_', ' ')}
                        </Badge>
                      )}
                      {institution.country && (
                        <Badge variant="outline" className="text-xs">
                          {institution.country}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {institution.website && (
                        <p>Website: <a href={institution.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{institution.website}</a></p>
                      )}
                      <p>Created: {new Date(institution.createdAt).toLocaleDateString()}</p>
                      {institution._count && institution._count.userEducation > 0 && (
                        <p>Used by {institution._count.userEducation} user(s)</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVerification(institution.id, institution.verified)}
                  >
                    {institution.verified ? 'Unverify' : 'Verify'}
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