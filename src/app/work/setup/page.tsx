'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { CompanySearch } from '@/components/ui/company-search';

interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
}

interface WorkingProject {
  id?: string;
  title: string;
  companyId?: string;
  companyName?: string;
  description?: string;
  challenge?: string;
  solution?: string;
  impact?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  projectType?: string;
}

interface WorkingAchievement {
  id?: string;
  title: string;
  description?: string;
  context?: string;
  quantifiedImpact?: {
    metric: string;
    value: string;
    improvement: string;
  }[];
  skillsDemonstrated?: string[];
  recognition?: string;
  dateAchieved?: string;
}

export default function WorkingSetupPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [workingProfileData, setWorkingProfileData] = useState({
    title: '',
    description: ''
  });

  const [projects, setProjects] = useState<WorkingProject[]>([{
    title: '',
    companyId: '',
    companyName: '',
    description: '',
    challenge: '',
    solution: '',
    impact: '',
    technologies: [],
    startDate: '',
    endDate: '',
    projectType: 'Professional'
  }]);

  const [achievements, setAchievements] = useState<WorkingAchievement[]>([{
    title: '',
    description: '',
    context: '',
    quantifiedImpact: [{ metric: '', value: '', improvement: '' }],
    skillsDemonstrated: [],
    recognition: '',
    dateAchieved: ''
  }]);

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
    }
  };

  // Project management functions
  const addProject = () => {
    setProjects(prev => [...prev, {
      title: '',
      companyId: '',
      companyName: '',
      description: '',
      challenge: '',
      solution: '',
      impact: '',
      technologies: [],
      startDate: '',
      endDate: '',
      projectType: 'Professional'
    }]);
  };

  const removeProject = (index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: keyof WorkingProject, value: any) => {
    setProjects(prev => prev.map((project, i) => 
      i === index ? { ...project, [field]: value } : project
    ));
  };

  const addTechnologyToProject = (index: number, tech: string) => {
    if (tech.trim()) {
      setProjects(prev => prev.map((project, i) => 
        i === index ? { 
          ...project, 
          technologies: [...(project.technologies || []), tech.trim()] 
        } : project
      ));
    }
  };

  const removeTechnologyFromProject = (index: number, techIndex: number) => {
    setProjects(prev => prev.map((project, i) => 
      i === index ? { 
        ...project, 
        technologies: (project.technologies || []).filter((_, ti) => ti !== techIndex) 
      } : project
    ));
  };

  // Achievement management functions
  const addAchievement = () => {
    setAchievements(prev => [...prev, {
      title: '',
      description: '',
      context: '',
      quantifiedImpact: [{ metric: '', value: '', improvement: '' }],
      skillsDemonstrated: [],
      recognition: '',
      dateAchieved: ''
    }]);
  };

  const removeAchievement = (index: number) => {
    setAchievements(prev => prev.filter((_, i) => i !== index));
  };

  const updateAchievement = (index: number, field: keyof WorkingAchievement, value: any) => {
    setAchievements(prev => prev.map((achievement, i) => 
      i === index ? { ...achievement, [field]: value } : achievement
    ));
  };

  const addImpactMetric = (achievementIndex: number) => {
    setAchievements(prev => prev.map((achievement, i) => 
      i === achievementIndex ? {
        ...achievement,
        quantifiedImpact: [
          ...(achievement.quantifiedImpact || []),
          { metric: '', value: '', improvement: '' }
        ]
      } : achievement
    ));
  };

  const updateImpactMetric = (achievementIndex: number, metricIndex: number, field: string, value: string) => {
    setAchievements(prev => prev.map((achievement, i) => 
      i === achievementIndex ? {
        ...achievement,
        quantifiedImpact: (achievement.quantifiedImpact || []).map((metric, mi) =>
          mi === metricIndex ? { ...metric, [field]: value } : metric
        )
      } : achievement
    ));
  };

  const saveWorkingProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/working', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: workingProfileData,
          projects: projects.filter(p => p.title.trim() !== ''),
          achievements: achievements.filter(a => a.title.trim() !== '')
        })
      });

      if (response.ok) {
        alert('Working profile saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save working profile'}`);
      }
    } catch (error) {
      console.error('Error saving working profile:', error);
      alert('Error saving working profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to create your working profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Setup Your Working Repository</h1>
        <p className="text-muted-foreground">Build your selective portfolio with projects, achievements, and multimedia</p>
      </div>

      {/* Working Profile Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Working Profile Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Portfolio Title</label>
            <Input
              value={workingProfileData.title}
              onChange={(e) => setWorkingProfileData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Senior Full-Stack Engineer Portfolio"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Portfolio Description</label>
            <textarea
              value={workingProfileData.description}
              onChange={(e) => setWorkingProfileData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief overview of your professional portfolio and what viewers will find..."
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Projects</CardTitle>
            <Button onClick={addProject} variant="outline" size="sm">
              Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {projects.map((project, index) => (
            <div key={index} className="border rounded-lg p-6 relative">
              {projects.length > 1 && (
                <Button
                  onClick={() => removeProject(index)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Title *</label>
                  <Input
                    value={project.title}
                    onChange={(e) => updateProject(index, 'title', e.target.value)}
                    placeholder="e.g., E-commerce Platform Redesign"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Company/Organization</label>
                  <CompanySearch
                    value={project.companyName || ''}
                    onSelect={(company) => {
                      updateProject(index, 'companyId', company.id);
                      updateProject(index, 'companyName', company.name);
                    }}
                    placeholder="Search for company..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Project Type</label>
                  <select
                    value={project.projectType}
                    onChange={(e) => updateProject(index, 'projectType', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Personal">Personal</option>
                    <option value="Open Source">Open Source</option>
                    <option value="Academic">Academic</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={project.startDate}
                      onChange={(e) => updateProject(index, 'startDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={project.endDate}
                      onChange={(e) => updateProject(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Brief overview of the project..."
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Challenge</label>
                  <textarea
                    value={project.challenge}
                    onChange={(e) => updateProject(index, 'challenge', e.target.value)}
                    placeholder="What problem did this project solve?"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Solution</label>
                  <textarea
                    value={project.solution}
                    onChange={(e) => updateProject(index, 'solution', e.target.value)}
                    placeholder="How did you approach and solve it?"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Impact</label>
                  <textarea
                    value={project.impact}
                    onChange={(e) => updateProject(index, 'impact', e.target.value)}
                    placeholder="What was the measurable impact or result?"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Technologies</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(project.technologies || []).map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="flex items-center gap-1">
                        {tech}
                        <button
                          onClick={() => removeTechnologyFromProject(index, techIndex)}
                          className="ml-1 text-xs hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add technology (e.g., React, Python, AWS)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTechnologyToProject(index, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addTechnologyToProject(index, input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Achievements</CardTitle>
            <Button onClick={addAchievement} variant="outline" size="sm">
              Add Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {achievements.map((achievement, index) => (
            <div key={index} className="border rounded-lg p-6 relative">
              {achievements.length > 1 && (
                <Button
                  onClick={() => removeAchievement(index)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Achievement Title *</label>
                  <Input
                    value={achievement.title}
                    onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                    placeholder="e.g., Reduced API response time by 60%"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date Achieved</label>
                  <Input
                    type="date"
                    value={achievement.dateAchieved}
                    onChange={(e) => updateAchievement(index, 'dateAchieved', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <textarea
                    value={achievement.description}
                    onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                    placeholder="Describe the achievement..."
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Context</label>
                  <textarea
                    value={achievement.context}
                    onChange={(e) => updateAchievement(index, 'context', e.target.value)}
                    placeholder="What was the situation or challenge?"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Quantified Impact</label>
                  {(achievement.quantifiedImpact || []).map((metric, metricIndex) => (
                    <div key={metricIndex} className="grid grid-cols-3 gap-2 mb-2">
                      <Input
                        placeholder="Metric (e.g., Response Time)"
                        value={metric.metric}
                        onChange={(e) => updateImpactMetric(index, metricIndex, 'metric', e.target.value)}
                      />
                      <Input
                        placeholder="Value (e.g., 300ms)"
                        value={metric.value}
                        onChange={(e) => updateImpactMetric(index, metricIndex, 'value', e.target.value)}
                      />
                      <Input
                        placeholder="Improvement (e.g., 60% faster)"
                        value={metric.improvement}
                        onChange={(e) => updateImpactMetric(index, metricIndex, 'improvement', e.target.value)}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addImpactMetric(index)}
                  >
                    Add Impact Metric
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Recognition</label>
                  <Input
                    value={achievement.recognition}
                    onChange={(e) => updateAchievement(index, 'recognition', e.target.value)}
                    placeholder="Any awards, mentions, or recognition received"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveWorkingProfile} disabled={loading} size="lg">
          {loading ? 'Saving...' : 'Save Working Profile'}
        </Button>
      </div>
    </div>
  );
}