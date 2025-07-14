'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';

interface Skill {
  id: string;
  name: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isVerified: boolean;
  marketDemand?: 'low' | 'medium' | 'high' | 'very_high';
  createdAt: string;
  _count?: {
    userSkills: number;
  };
}

const SKILL_CATEGORIES = [
  'Programming Languages',
  'Web Development',
  'Data Science',
  'Cloud Computing',
  'DevOps',
  'Mobile Development',
  'AI/Machine Learning',
  'Cybersecurity',
  'Database',
  'Design',
  'Project Management',
  'Business',
  'Marketing',
  'Sales',
  'Other'
];

const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const MARKET_DEMAND_LEVELS = ['low', 'medium', 'high', 'very_high'];

export default function SkillsPage() {
  const { isSignedIn } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: '',
    difficulty: 'intermediate' as const,
    marketDemand: 'medium' as const
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchSkills();
    }
  }, [isSignedIn]);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/admin/entities/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/admin/entities/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkill.name.trim(),
          category: newSkill.category || undefined,
          difficulty: newSkill.difficulty,
          marketDemand: newSkill.marketDemand
        })
      });

      if (response.ok) {
        const skill = await response.json();
        setSkills(prev => [skill, ...prev]);
        setNewSkill({ name: '', category: '', difficulty: 'intermediate', marketDemand: 'medium' });
      }
    } catch (error) {
      console.error('Error creating skill:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleVerification = async (skillId: string, isVerified: boolean) => {
    try {
      const response = await fetch(`/api/admin/entities/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: !isVerified })
      });

      if (response.ok) {
        setSkills(prev => prev.map(skill => 
          skill.id === skillId 
            ? { ...skill, isVerified: !isVerified }
            : skill
        ));
      }
    } catch (error) {
      console.error('Error updating skill verification:', error);
    }
  };

  const filteredSkills = filterCategory 
    ? skills.filter(skill => skill.category === filterCategory)
    : skills;

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDemandColor = (demand?: string) => {
    switch (demand) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-purple-100 text-purple-800';
      case 'very_high': return 'bg-pink-100 text-pink-800';
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
          <h1 className="text-3xl font-bold">Skills Management</h1>
          <p className="text-muted-foreground">Manage skills for user profiles and job matching</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredSkills.length} skills {filterCategory && `in ${filterCategory}`}
        </Badge>
      </div>

      {/* Create Skill Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createSkill} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Skill Name *</label>
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., React, Python, Project Management"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  {SKILL_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <select
                  value={newSkill.difficulty}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, difficulty: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {DIFFICULTY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Market Demand</label>
                <select
                  value={newSkill.marketDemand}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, marketDemand: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {MARKET_DEMAND_LEVELS.map(level => (
                    <option key={level} value={level}>{level.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" disabled={creating || !newSkill.name.trim()}>
              {creating ? 'Creating...' : 'Add Skill'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory('')}
            >
              All Categories ({skills.length})
            </Button>
            {SKILL_CATEGORIES.map(category => {
              const count = skills.filter(skill => skill.category === category).length;
              if (count === 0) return null;
              return (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                >
                  {category} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterCategory ? `${filterCategory} Skills` : 'All Skills'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading skills...</p>
          ) : filteredSkills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {filterCategory ? `No skills in ${filterCategory} category` : 'No skills created yet'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSkills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{skill.name}</h3>
                      <Badge variant={skill.isVerified ? "default" : "secondary"}>
                        {skill.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                      {skill.category && (
                        <Badge variant="outline" className="text-xs">
                          {skill.category}
                        </Badge>
                      )}
                      {skill.difficulty && (
                        <Badge className={`text-xs ${getDifficultyColor(skill.difficulty)}`}>
                          {skill.difficulty}
                        </Badge>
                      )}
                      {skill.marketDemand && (
                        <Badge className={`text-xs ${getDemandColor(skill.marketDemand)}`}>
                          {skill.marketDemand.replace('_', ' ')} demand
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Created: {new Date(skill.createdAt).toLocaleDateString()}</p>
                      {skill._count && skill._count.userSkills > 0 && (
                        <p>Used by {skill._count.userSkills} user(s)</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVerification(skill.id, skill.isVerified)}
                  >
                    {skill.isVerified ? 'Unverify' : 'Verify'}
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