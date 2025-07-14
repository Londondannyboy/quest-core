'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';

interface PersonalGoal {
  id?: string;
  goalType: string;
  title: string;
  description?: string;
  targetDate?: string;
  progressPercentage: number;
  okrs?: {
    keyResult: string;
    progress: number;
  }[];
}

interface PersonalNote {
  id?: string;
  noteType: string;
  content: string;
  tags?: string[];
  createdAt?: string;
}

export default function PersonalRepoPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [goals, setGoals] = useState<PersonalGoal[]>([{
    goalType: 'Professional',
    title: '',
    description: '',
    targetDate: '',
    progressPercentage: 0,
    okrs: []
  }]);

  const [newNote, setNewNote] = useState<PersonalNote>({
    noteType: 'reflection',
    content: '',
    tags: []
  });

  const [existingNotes, setExistingNotes] = useState<PersonalNote[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (isSignedIn) {
      fetchPersonalRepo();
    }
  }, [isSignedIn]);

  const fetchPersonalRepo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/personal');
      if (response.ok) {
        const data = await response.json();
        if (data.goals?.length > 0) {
          setGoals(data.goals);
        }
        setExistingNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error fetching personal repo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Goal management functions
  const addGoal = () => {
    setGoals(prev => [...prev, {
      goalType: 'Professional',
      title: '',
      description: '',
      targetDate: '',
      progressPercentage: 0,
      okrs: []
    }]);
  };

  const removeGoal = (index: number) => {
    setGoals(prev => prev.filter((_, i) => i !== index));
  };

  const updateGoal = (index: number, field: keyof PersonalGoal, value: any) => {
    setGoals(prev => prev.map((goal, i) => 
      i === index ? { ...goal, [field]: value } : goal
    ));
  };

  const addOKR = (goalIndex: number) => {
    setGoals(prev => prev.map((goal, i) => 
      i === goalIndex ? {
        ...goal,
        okrs: [...(goal.okrs || []), { keyResult: '', progress: 0 }]
      } : goal
    ));
  };

  const updateOKR = (goalIndex: number, okrIndex: number, field: string, value: any) => {
    setGoals(prev => prev.map((goal, i) => 
      i === goalIndex ? {
        ...goal,
        okrs: (goal.okrs || []).map((okr, oi) =>
          oi === okrIndex ? { ...okr, [field]: value } : okr
        )
      } : goal
    ));
  };

  const removeOKR = (goalIndex: number, okrIndex: number) => {
    setGoals(prev => prev.map((goal, i) => 
      i === goalIndex ? {
        ...goal,
        okrs: (goal.okrs || []).filter((_, oi) => oi !== okrIndex)
      } : goal
    ));
  };

  // Note management functions
  const addTag = () => {
    if (newTag.trim() && !newNote.tags?.includes(newTag.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagIndex: number) => {
    setNewNote(prev => ({
      ...prev,
      tags: (prev.tags || []).filter((_, i) => i !== tagIndex)
    }));
  };

  const saveNote = async () => {
    if (newNote.content.trim()) {
      try {
        const response = await fetch('/api/profile/personal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: [newNote]
          })
        });

        if (response.ok) {
          // Reset note form
          setNewNote({
            noteType: 'reflection',
            content: '',
            tags: []
          });
          // Refresh data
          fetchPersonalRepo();
          alert('Note saved successfully!');
        } else {
          alert('Error saving note');
        }
      } catch (error) {
        console.error('Error saving note:', error);
        alert('Error saving note');
      }
    }
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: goals.filter(goal => goal.title.trim() !== '')
        })
      });

      if (response.ok) {
        alert('Goals saved successfully!');
        fetchPersonalRepo(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save goals'}`);
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Error saving goals');
    } finally {
      setSaving(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to access your personal repository.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Personal Repository</h1>
        <p className="text-muted-foreground">Private space for goals, reflections, and personal development</p>
      </div>

      {/* Goals Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              Personal Goals & OKRs
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={addGoal} variant="outline" size="sm">
                Add Goal
              </Button>
              <Button onClick={saveGoals} disabled={saving} size="sm">
                {saving ? 'Saving...' : 'Save Goals'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {goals.map((goal, index) => (
            <div key={index} className="border rounded-lg p-6 relative">
              {goals.length > 1 && (
                <Button
                  onClick={() => removeGoal(index)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Goal Title *</label>
                  <Input
                    value={goal.title}
                    onChange={(e) => updateGoal(index, 'title', e.target.value)}
                    placeholder="e.g., Master React Development"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Goal Type</label>
                  <select
                    value={goal.goalType}
                    onChange={(e) => updateGoal(index, 'goalType', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Personal">Personal</option>
                    <option value="Learning">Learning</option>
                    <option value="Health">Health</option>
                    <option value="Financial">Financial</option>
                    <option value="Relationship">Relationship</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Target Date</label>
                  <Input
                    type="date"
                    value={goal.targetDate}
                    onChange={(e) => updateGoal(index, 'targetDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Progress ({goal.progressPercentage}%)</label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progressPercentage}
                    onChange={(e) => updateGoal(index, 'progressPercentage', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${goal.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  value={goal.description}
                  onChange={(e) => updateGoal(index, 'description', e.target.value)}
                  placeholder="Detailed description of what you want to achieve..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                />
              </div>

              {/* OKRs Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Key Results (OKRs)</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOKR(index)}
                  >
                    Add Key Result
                  </Button>
                </div>
                {(goal.okrs || []).map((okr, okrIndex) => (
                  <div key={okrIndex} className="border rounded p-3 mb-2">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Key result description"
                          value={okr.keyResult}
                          onChange={(e) => updateOKR(index, okrIndex, 'keyResult', e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Progress:</span>
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={okr.progress}
                            onChange={(e) => updateOKR(index, okrIndex, 'progress', parseInt(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm w-12">{okr.progress}%</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOKR(index, okrIndex)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            Personal Notes & Reflections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New Note */}
          <div className="border rounded-lg p-4 mb-6">
            <h4 className="font-medium mb-3">Add New Note</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Note Type</label>
                <select
                  value={newNote.noteType}
                  onChange={(e) => setNewNote(prev => ({ ...prev, noteType: e.target.value }))}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="reflection">Reflection</option>
                  <option value="learning">Learning</option>
                  <option value="idea">Idea</option>
                  <option value="feedback">Feedback</option>
                  <option value="observation">Observation</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="What's on your mind? Share your thoughts, learnings, or reflections..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(newNote.tags || []).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => removeTag(tagIndex)}
                        className="ml-1 text-xs hover:text-red-500"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>

              <Button onClick={saveNote} disabled={!newNote.content.trim()}>
                Save Note
              </Button>
            </div>
          </div>

          {/* Existing Notes */}
          {existingNotes.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Recent Notes ({existingNotes.length})</h4>
              <div className="space-y-3">
                {existingNotes.slice(0, 10).map((note) => (
                  <div key={note.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{note.noteType}</Badge>
                      {note.createdAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-2">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}