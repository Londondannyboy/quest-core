'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface WorkingProfile {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkingProject {
  id: string;
  title: string;
  description?: string;
  challenge?: string;
  solution?: string;
  impact?: string;
  technologies?: string[];
  startDate?: string;
  endDate?: string;
  projectType: string;
  company?: {
    name: string;
  };
}

interface WorkingAchievement {
  id: string;
  title: string;
  description?: string;
  context?: string;
  quantifiedImpact?: {
    metric: string;
    value: string;
    improvement: string;
  }[];
  recognition?: string;
  dateAchieved?: string;
}

export default function WorkingProfilePage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<WorkingProfile | null>(null);
  const [projects, setProjects] = useState<WorkingProject[]>([]);
  const [achievements, setAchievements] = useState<WorkingAchievement[]>([]);

  useEffect(() => {
    if (isSignedIn) {
      fetchWorkingProfile();
    }
  }, [isSignedIn]);

  const fetchWorkingProfile = async () => {
    try {
      const response = await fetch('/api/profile/working');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setProjects(data.projects || []);
        setAchievements(data.achievements || []);
      }
    } catch (error) {
      console.error('Error fetching working profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to view your working profile.</p>
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
            <p className="text-center text-muted-foreground">Loading working profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">You haven't created a working profile yet.</p>
              <Link href="/work/setup">
                <Button>Create Working Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{profile.title}</h1>
          {profile.description && (
            <p className="text-muted-foreground mt-2">{profile.description}</p>
          )}
        </div>
        <Link href="/work/setup">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      </div>

      {/* Projects Section */}
      {projects.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    {project.company && (
                      <p className="text-muted-foreground">{project.company.name}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{project.projectType}</Badge>
                      {project.startDate && (
                        <Badge variant="outline">
                          {new Date(project.startDate).getFullYear()}
                          {project.endDate && ` - ${new Date(project.endDate).getFullYear()}`}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {project.description && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                )}

                {project.challenge && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Challenge</h4>
                    <p className="text-sm text-muted-foreground">{project.challenge}</p>
                  </div>
                )}

                {project.solution && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Solution</h4>
                    <p className="text-sm text-muted-foreground">{project.solution}</p>
                  </div>
                )}

                {project.impact && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Impact</h4>
                    <p className="text-sm text-muted-foreground">{project.impact}</p>
                  </div>
                )}

                {project.technologies && project.technologies.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Technologies</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant="outline">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Achievements ({achievements.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{achievement.title}</h3>
                    {achievement.dateAchieved && (
                      <p className="text-muted-foreground">
                        {new Date(achievement.dateAchieved).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {achievement.description && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                )}

                {achievement.context && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Context</h4>
                    <p className="text-sm text-muted-foreground">{achievement.context}</p>
                  </div>
                )}

                {achievement.quantifiedImpact && achievement.quantifiedImpact.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Quantified Impact</h4>
                    <div className="grid gap-2">
                      {achievement.quantifiedImpact.map((metric, index) => (
                        <div key={index} className="flex gap-4 text-sm">
                          <span className="font-medium">{metric.metric}:</span>
                          <span>{metric.value}</span>
                          <span className="text-green-600">({metric.improvement})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {achievement.recognition && (
                  <div>
                    <h4 className="font-medium mb-2">Recognition</h4>
                    <p className="text-sm text-muted-foreground">{achievement.recognition}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {projects.length === 0 && achievements.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No projects or achievements added yet.</p>
              <Link href="/work/setup">
                <Button>Add Content</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}