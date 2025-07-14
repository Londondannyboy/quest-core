'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Institution {
  id: string;
  name: string;
  website?: string;
  type?: string;
  country?: string;
  verified: boolean;
}

interface InstitutionSearchProps {
  value: string;
  onSelect: (institution: Institution) => void;
  placeholder?: string;
}

export function InstitutionSearch({ value, onSelect, placeholder = "Search institutions..." }: InstitutionSearchProps) {
  const [query, setQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [newInstitutionWebsite, setNewInstitutionWebsite] = useState('');
  const [newInstitutionType, setNewInstitutionType] = useState('University');
  const [newInstitutionCountry, setNewInstitutionCountry] = useState('US');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleInstitutionSelect = (institution: Institution) => {
    onSelect(institution);
    setQuery(institution.name);
    setShowDropdown(false);
    setShowCreateForm(false);
  };

  const handleCreateInstitution = async () => {
    if (!newInstitutionName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/education/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newInstitutionName.trim(),
          website: newInstitutionWebsite.trim() || undefined,
          type: newInstitutionType,
          country: newInstitutionCountry
        })
      });

      if (response.ok) {
        const institution = await response.json();
        handleInstitutionSelect(institution);
        setNewInstitutionName('');
        setNewInstitutionWebsite('');
        setNewInstitutionType('University');
        setNewInstitutionCountry('US');
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

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        onFocus={() => query.length >= 2 && setShowDropdown(true)}
        onBlur={() => {
          // Delay hiding to allow clicks on dropdown items
          setTimeout(() => setShowDropdown(false), 200);
        }}
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
                      {institution.type && (
                        <div className="text-sm text-gray-500">{institution.type}</div>
                      )}
                      {institution.country && (
                        <div className="text-xs text-gray-400">{institution.country}</div>
                      )}
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
                  setNewInstitutionName(query);
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
                setNewInstitutionName(query);
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
                value={newInstitutionName}
                onChange={(e) => setNewInstitutionName(e.target.value)}
                placeholder="Enter institution name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <select
                value={newInstitutionType}
                onChange={(e) => setNewInstitutionType(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="University">University</option>
                <option value="College">College</option>
                <option value="Institute">Institute</option>
                <option value="School">School</option>
                <option value="Academy">Academy</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Country</label>
              <select
                value={newInstitutionCountry}
                onChange={(e) => setNewInstitutionCountry(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="NL">Netherlands</option>
                <option value="CH">Switzerland</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input
                value={newInstitutionWebsite}
                onChange={(e) => setNewInstitutionWebsite(e.target.value)}
                placeholder="https://institution.edu"
                type="url"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateInstitution}
                disabled={creating || !newInstitutionName.trim()}
                size="sm"
              >
                {creating ? 'Creating...' : 'Create Institution'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewInstitutionName('');
                  setNewInstitutionWebsite('');
                  setNewInstitutionType('University');
                  setNewInstitutionCountry('US');
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