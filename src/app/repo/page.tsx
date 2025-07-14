'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

// Interface definitions for all repo layers
interface SurfaceProfile {
  id: string;
  headline?: string;
  location?: string;
  publicBio?: string;
  isPublic: boolean;
}

interface WorkExperience {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  company: {
    name: string;
    industry?: string;
  };
}

interface UserSkill {
  id: string;
  proficiencyLevel?: string;
  yearsOfExperience?: number;
  isShowcase: boolean;
  skill: {
    name: string;
    category?: string;
  };
}

interface WorkingProfile {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
}

interface WorkingProject {
  id: string;
  title: string;
  description?: string;
  challenge?: string;
  solution?: string;
  impact?: string;
  technologies?: string[];
  projectType: string;
  startDate?: string;
  endDate?: string;
  company?: {
    name: string;
  };
}

interface WorkingAchievement {
  id: string;
  title: string;
  description?: string;
  context?: string;
  quantifiedImpact?: any;
  recognition?: string;
  dateAchieved?: string;
}

interface PersonalGoal {
  id: string;
  goalType?: string;
  title?: string;
  description?: string;
  targetDate?: string;
  progressPercentage?: number;
}

interface PersonalNote {
  id: string;
  noteType?: string;
  content?: string;
  tags?: string[];
  createdAt: string;
}

interface TrinityCore {
  id: string;
  questAnalysis?: any;
  serviceAnalysis?: any;
  pledgeAnalysis?: any;
  coherenceScore?: number;
  lastUpdated: string;
}

interface DeepInsight {
  id: string;
  insightType?: string;
  aiAnalysis?: any;
  confidenceScore?: number;
  generatedAt: string;
}

interface FullRepoData {
  surface?: {
    profile?: SurfaceProfile;
    workExperiences: WorkExperience[];
    skills: UserSkill[];
    education: any[];
  };
  working?: {
    profile?: WorkingProfile;
    projects: WorkingProject[];
    achievements: WorkingAchievement[];
    media: any[];
  };
  personal?: {
    goals: PersonalGoal[];
    notes: PersonalNote[];
  };
  deep?: {
    trinityCore?: TrinityCore;
    insights: DeepInsight[];
  };
}

export default function FullRepoPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [repoData, setRepoData] = useState<FullRepoData>({});
  const [activeLayer, setActiveLayer] = useState<'surface' | 'working' | 'personal' | 'deep'>('surface');

  useEffect(() => {
    if (isSignedIn) {
      fetchFullRepo();
    }
  }, [isSignedIn]);

  const fetchFullRepo = async () => {
    try {
      // Fetch data from all repo layers
      const [surfaceRes, workingRes, personalRes, deepRes] = await Promise.all([
        fetch('/api/profile/surface'),
        fetch('/api/profile/working'),
        fetch('/api/profile/personal'),
        fetch('/api/profile/deep')
      ]);

      const data: FullRepoData = {};

      if (surfaceRes.ok) {
        data.surface = await surfaceRes.json();
      }

      if (workingRes.ok) {
        data.working = await workingRes.json();
      }

      if (personalRes.ok) {
        data.personal = await personalRes.json();
      }

      if (deepRes.ok) {
        data.deep = await deepRes.json();
      }

      setRepoData(data);
    } catch (error) {
      console.error('Error fetching full repo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRepoCompleteness = () => {
    let totalSections = 0;
    let completedSections = 0;

    // Surface layer
    totalSections += 3; // profile, work experiences, skills
    if (repoData.surface?.profile) completedSections++;
    if (repoData.surface?.workExperiences?.length > 0) completedSections++;
    if (repoData.surface?.skills?.length > 0) completedSections++;

    // Working layer
    totalSections += 2; // profile, projects/achievements
    if (repoData.working?.profile) completedSections++;
    if ((repoData.working?.projects?.length || 0) + (repoData.working?.achievements?.length || 0) > 0) completedSections++;

    // Personal layer
    totalSections += 2; // goals, notes
    if (repoData.personal?.goals?.length > 0) completedSections++;
    if (repoData.personal?.notes?.length > 0) completedSections++;

    // Deep layer
    totalSections += 1; // trinity core
    if (repoData.deep?.trinityCore) completedSections++;

    return Math.round((completedSections / totalSections) * 100);
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to view your repository.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading your 4-layer repository...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completeness = getRepoCompleteness();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your 4-Layer Professional Repository</h1>
        <p className="text-muted-foreground">Complete view of your professional development journey</p>
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Repository Completeness:</span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{completeness}%</span>
          </div>
        </div>
      </div>

      {/* Layer Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'surface', label: 'Surface (Public)', color: 'bg-blue-500' },
          { key: 'working', label: 'Working (Selective)', color: 'bg-green-500' },
          { key: 'personal', label: 'Personal (Private)', color: 'bg-yellow-500' },
          { key: 'deep', label: 'Deep (System)', color: 'bg-purple-500' }
        ].map((layer) => (
          <Button
            key={layer.key}
            variant={activeLayer === layer.key ? 'default' : 'outline'}
            onClick={() => setActiveLayer(layer.key as any)}
            className="whitespace-nowrap"
          >
            <div className={`w-3 h-3 rounded-full ${layer.color} mr-2`}></div>
            {layer.label}
          </Button>
        ))}
      </div>

      {/* Surface Layer */}
      {activeLayer === 'surface' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  Surface Repository - Public Professional Profile
                </CardTitle>
                <Link href="/profile/setup">
                  <Button variant="outline" size="sm">Edit Surface Profile</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {repoData.surface?.profile ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{repoData.surface.profile.headline || 'No headline set'}</h3>
                    <p className="text-muted-foreground">{repoData.surface.profile.location}</p>
                    <p className="mt-2">{repoData.surface.profile.publicBio}</p>
                  </div>
                  
                  {repoData.surface.workExperiences?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Work Experience ({repoData.surface.workExperiences.length})</h4>
                      <div className="space-y-2">
                        {repoData.surface.workExperiences.slice(0, 3).map((exp) => (
                          <div key={exp.id} className="border rounded p-3">
                            <div className="font-medium">{exp.title}</div>
                            <div className="text-sm text-muted-foreground">{exp.company.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {exp.startDate && new Date(exp.startDate).getFullYear()} - {exp.isCurrent ? 'Present' : (exp.endDate && new Date(exp.endDate).getFullYear())}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {repoData.surface.skills?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Skills ({repoData.surface.skills.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {repoData.surface.skills.filter(s => s.isShowcase).slice(0, 10).map((skill) => (
                          <Badge key={skill.id} variant="secondary">
                            {skill.skill.name} ({skill.proficiencyLevel})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No surface profile created yet</p>
                  <Link href="/profile/setup">
                    <Button>Create Surface Profile</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Working Layer */}
      {activeLayer === 'working' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  Working Repository - Selective Portfolio
                </CardTitle>
                <Link href="/work/setup">
                  <Button variant="outline" size="sm">Edit Working Profile</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {repoData.working?.profile ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{repoData.working.profile.title}</h3>
                    {repoData.working.profile.description && (
                      <p className="text-muted-foreground">{repoData.working.profile.description}</p>
                    )}
                  </div>

                  {repoData.working.projects?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Projects ({repoData.working.projects.length})</h4>
                      <div className="space-y-3">
                        {repoData.working.projects.slice(0, 2).map((project) => (
                          <div key={project.id} className="border rounded p-4">
                            <div className="font-medium">{project.title}</div>
                            <div className="text-sm text-muted-foreground">{project.company?.name}</div>
                            <Badge variant="outline" className="mt-1">{project.projectType}</Badge>
                            {project.challenge && (
                              <p className="text-sm mt-2">{project.challenge.substring(0, 100)}...</p>
                            )}
                            {project.technologies && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {project.technologies.slice(0, 5).map((tech, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tech}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {repoData.working.achievements?.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Achievements ({repoData.working.achievements.length})</h4>
                      <div className="space-y-2">
                        {repoData.working.achievements.slice(0, 3).map((achievement) => (
                          <div key={achievement.id} className="border rounded p-3">
                            <div className="font-medium">{achievement.title}</div>
                            {achievement.description && (
                              <p className="text-sm text-muted-foreground">{achievement.description.substring(0, 100)}...</p>
                            )}
                            {achievement.dateAchieved && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {new Date(achievement.dateAchieved).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No working profile created yet</p>
                  <Link href="/work/setup">
                    <Button>Create Working Profile</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Personal Layer */}
      {activeLayer === 'personal' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  Personal Repository - Development & Goals
                </CardTitle>
                <Link href="/repo/personal">
                  <Button variant="outline" size="sm">Edit Personal Repo</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repoData.personal?.goals?.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">Goals ({repoData.personal.goals.length})</h4>
                    <div className="space-y-2">
                      {repoData.personal.goals.slice(0, 3).map((goal) => (
                        <div key={goal.id} className="border rounded p-3">
                          <div className="font-medium">{goal.title}</div>
                          <div className="text-sm text-muted-foreground">{goal.goalType}</div>
                          {goal.progressPercentage !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-yellow-500 h-1.5 rounded-full" 
                                style={{ width: `${goal.progressPercentage}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No personal goals set yet</p>
                  </div>
                )}

                {repoData.personal?.notes?.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">Recent Notes ({repoData.personal.notes.length})</h4>
                    <div className="space-y-2">
                      {repoData.personal.notes.slice(0, 3).map((note) => (
                        <div key={note.id} className="border rounded p-3">
                          <div className="text-sm">{note.content?.substring(0, 100)}...</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No personal notes yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deep Layer */}
      {activeLayer === 'deep' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  Deep Repository - AI Insights & Trinity
                </CardTitle>
                <Link href="/trinity/create">
                  <Button variant="outline" size="sm">Update Trinity</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repoData.deep?.trinityCore ? (
                  <div>
                    <h4 className="font-medium mb-2">Trinity Core</h4>
                    <div className="border rounded p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="font-medium text-sm">Quest</div>
                          <div className="text-xs text-muted-foreground">Personal mission</div>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Service</div>
                          <div className="text-xs text-muted-foreground">Value to others</div>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Pledge</div>
                          <div className="text-xs text-muted-foreground">Daily commitment</div>
                        </div>
                      </div>
                      {repoData.deep.trinityCore.coherenceScore && (
                        <div className="mt-3">
                          <div className="text-sm">Coherence Score: {Math.round(repoData.deep.trinityCore.coherenceScore * 100)}%</div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-purple-500 h-1.5 rounded-full" 
                              style={{ width: `${repoData.deep.trinityCore.coherenceScore * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">No Trinity Core created yet</p>
                    <Link href="/trinity/create">
                      <Button size="sm">Create Trinity</Button>
                    </Link>
                  </div>
                )}

                {repoData.deep?.insights?.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">AI Insights ({repoData.deep.insights.length})</h4>
                    <div className="space-y-2">
                      {repoData.deep.insights.slice(0, 3).map((insight) => (
                        <div key={insight.id} className="border rounded p-3">
                          <div className="font-medium text-sm">{insight.insightType}</div>
                          <div className="text-xs text-muted-foreground">
                            Confidence: {Math.round((insight.confidenceScore || 0) * 100)}% • 
                            {new Date(insight.generatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No AI insights generated yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/profile/setup">
              <Button variant="outline" className="w-full">
                Update Surface
              </Button>
            </Link>
            <Link href="/work/setup">
              <Button variant="outline" className="w-full">
                Add Projects
              </Button>
            </Link>
            <Link href="/repo/personal">
              <Button variant="outline" className="w-full">
                Set Goals
              </Button>
            </Link>
            <Link href="/trinity/create">
              <Button variant="outline" className="w-full">
                Define Trinity
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}