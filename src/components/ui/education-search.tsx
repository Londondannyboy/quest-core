'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Institution {
  id: string;
  name: string;
  type?: string;
  country?: string;
  website?: string;
  verified: boolean;
}

interface EducationSearchProps {
  value: string;
  onSelect: (institution: Institution) => void;
  placeholder?: string;
}

export function EducationSearch({ value, onSelect, placeholder = "Search institutions..." }: EducationSearchProps) {
  const [query, setQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstitution, setNewInstitution] = useState({
    name: '',
    type: 'university',
    country: '',
    website: ''
  });
  const [creating, setCreating] = useState(false);

  // Search institutions as user types
  useEffect(() => {
    if (query.length < 2) {
      setInstitutions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/education/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results = await response.json();
          setInstitutions(results);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching institutions:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleInstitutionSelect = (institution: Institution) => {
    onSelect(institution);
    setQuery(institution.name);
    setShowDropdown(false);
    setShowCreateForm(false);
  };

  const handleCreateInstitution = async () => {
    if (!newInstitution.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/education/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInstitution.name.trim(),
          type: newInstitution.type,
          country: newInstitution.country.trim() || undefined,
          website: newInstitution.website.trim() || undefined
        })
      });

      if (response.ok) {
        const institution = await response.json();
        handleInstitutionSelect(institution);
        setNewInstitution({ name: '', type: 'university', country: '', website: '' });
      } else {
        const error = await response.json();
        alert(`Failed to create institution: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating institution:', error);
      alert('Failed to create institution');
    } finally {
      setCreating(false);
    }
  };

  const getTypeDisplay = (type?: string) => {
    if (!type) return '';
    return type.replace('_', ' ');
  };

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Searching...</div>
          ) : institutions.length > 0 ? (
            <>
              {institutions.map((institution) => (
                <div
                  key={institution.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleInstitutionSelect(institution)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{institution.name}</div>
                      <div className="text-sm text-gray-500 space-x-2">
                        {institution.type && <span>{getTypeDisplay(institution.type)}</span>}
                        {institution.country && <span>• {institution.country}</span>}
                      </div>
                      {institution.website && (
                        <div className="text-xs text-blue-600">{institution.website}</div>
                      )}
                    </div>
                    {institution.verified && (
                      <Badge variant="default" className="text-xs">Verified</Badge>
                    )}
                  </div>
                </div>
              ))}
              <div
                className="p-3 text-blue-600 hover:bg-gray-50 cursor-pointer border-t font-medium"
                onClick={() => {
                  setShowCreateForm(true);
                  setShowDropdown(false);
                  setNewInstitution(prev => ({ ...prev, name: query }));
                }}
              >
                + Create &quot;{query}&quot;
              </div>
            </>
          ) : (
            <div
              className="p-3 text-blue-600 hover:bg-gray-50 cursor-pointer font-medium"
              onClick={() => {
                setShowCreateForm(true);
                setShowDropdown(false);
                setNewInstitution(prev => ({ ...prev, name: query }));
              }}
            >
              + Create &quot;{query}&quot;
            </div>
          )}
        </div>
      )}

      {/* Create New Institution Form */}
      {showCreateForm && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4">
          <h3 className="font-medium mb-3">Create New Institution</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Institution Name *</label>
              <Input
                value={newInstitution.name}
                onChange={(e) => setNewInstitution(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter institution name"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Type</label>
                <select
                  value={newInstitution.type}
                  onChange={(e) => setNewInstitution(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="community_college">Community College</option>
                  <option value="trade_school">Trade School</option>
                  <option value="bootcamp">Bootcamp</option>
                  <option value="online_platform">Online Platform</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Country</label>
                <Input
                  value={newInstitution.country}
                  onChange={(e) => setNewInstitution(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateInstitution}
                disabled={creating || !newInstitution.name.trim()}
                size="sm"
              >
                {creating ? 'Creating...' : 'Create Institution'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewInstitution({ name: '', type: 'university', country: '', website: '' });
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}