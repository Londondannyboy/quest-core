'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  verified: boolean;
}

interface CompanySearchProps {
  value: string;
  onSelect: (company: Company) => void;
  placeholder?: string;
}

export function CompanySearch({ value, onSelect, placeholder = "Search companies..." }: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search companies as user types
  useEffect(() => {
    if (query.length < 2) {
      setCompanies([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results = await response.json();
          setCompanies(results);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching companies:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleCompanySelect = (company: Company) => {
    onSelect(company);
    setQuery(company.name);
    setShowDropdown(false);
    setShowCreateForm(false);
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/companies/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          website: newCompanyWebsite.trim() || undefined
        })
      });

      if (response.ok) {
        const company = await response.json();
        handleCompanySelect(company);
        setNewCompanyName('');
        setNewCompanyWebsite('');
      } else {
        const error = await response.json();
        alert(`Failed to create company: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      alert('Failed to create company');
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
          ) : companies.length > 0 ? (
            <>
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleCompanySelect(company)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{company.name}</div>
                      {company.industry && (
                        <div className="text-sm text-gray-500">{company.industry}</div>
                      )}
                      {company.website && (
                        <div className="text-xs text-blue-600">{company.website}</div>
                      )}
                    </div>
                    {company.verified && (
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
                  setNewCompanyName(query);
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
                setNewCompanyName(query);
              }}
            >
              + Create &quot;{query}&quot;
            </div>
          )}
        </div>
      )}

      {/* Create New Company Form */}
      {showCreateForm && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4">
          <h3 className="font-medium mb-3">Create New Company</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Company Name *</label>
              <Input
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input
                value={newCompanyWebsite}
                onChange={(e) => setNewCompanyWebsite(e.target.value)}
                placeholder="https://company.com"
                type="url"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateCompany}
                disabled={creating || !newCompanyName.trim()}
                size="sm"
              >
                {creating ? 'Creating...' : 'Create Company'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewCompanyName('');
                  setNewCompanyWebsite('');
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