'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Skill {
  id: string;
  name: string;
  category?: string;
  difficultyLevel?: string;
  verified: boolean;
}

interface SkillSearchProps {
  value: string;
  onSelect: (skill: Skill) => void;
  placeholder?: string;
}

export function SkillSearch({ value, onSelect, placeholder = "Search skills..." }: SkillSearchProps) {
  const [query, setQuery] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [creating, setCreating] = useState(false);

  // Search skills as user types
  useEffect(() => {
    if (query.length < 2) {
      setSkills([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    const searchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/skills/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const results = await response.json();
          setSkills(results);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching skills:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleSkillSelect = (skill: Skill) => {
    onSelect(skill);
    setQuery(skill.name);
    setShowDropdown(false);
    setShowCreateForm(false);
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/skills/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkillName.trim()
        })
      });

      if (response.ok) {
        const skill = await response.json();
        handleSkillSelect(skill);
        setNewSkillName('');
      } else {
        const error = await response.json();
        alert(`Failed to create skill: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating skill:', error);
      alert('Failed to create skill');
    } finally {
      setCreating(false);
    }
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
          ) : skills.length > 0 ? (
            <>
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSkillSelect(skill)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{skill.name}</div>
                      {skill.category && (
                        <div className="text-sm text-gray-500">{skill.category}</div>
                      )}
                      {skill.difficultyLevel && (
                        <div className="text-xs text-gray-400">{skill.difficultyLevel}</div>
                      )}
                    </div>
                    {skill.verified && (
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
                  setNewSkillName(query);
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
                setNewSkillName(query);
              }}
            >
              + Create &quot;{query}&quot;
            </div>
          )}
        </div>
      )}

      {/* Create New Skill Form */}
      {showCreateForm && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 p-4">
          <h3 className="font-medium mb-3">Create New Skill</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Skill Name *</label>
              <Input
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="Enter skill name"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateSkill}
                disabled={creating || !newSkillName.trim()}
                size="sm"
              >
                {creating ? 'Creating...' : 'Create Skill'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewSkillName('');
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