'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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
    website?: string;
  };
  workingMedia?: WorkingMedia[];
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
  workingMedia?: WorkingMedia[];
}

interface WorkingMedia {
  id: string;
  mediaType: string;
  title?: string;
  description?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
}

interface WorkingProfile {
  id: string;
  title: string;
  description?: string;
  user: {
    name?: string;
    email: string;
  };
  workingProjects: WorkingProject[];
  workingAchievements: WorkingAchievement[];
  workingMedia: WorkingMedia[];
}

interface ViewData {
  profile: WorkingProfile;
  accessLevel: string;
  viewerEmail?: string;
  viewerName?: string;
}

export default function ViewWorkingProfilePage() {
  const params = useParams();
  const token = params.token as string;
  const [viewData, setViewData] = useState<ViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchProfileData();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfileData = async () => {
    try {
      const response = await fetch(`/api/working-repo/view?token=${token}`);
      
      if (response.ok) {
        const data = await response.json();
        setViewData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getAccessLevelDescription = (level: string) => {
    const descriptions = {
      recruiter: 'Limited Access - Selected projects and achievements',
      collaborator: 'Extended Access - Full projects and selected achievements',
      mentor: 'Full Access - Complete portfolio view',
      full: 'Complete Access - All content and media'
    };
    return descriptions[level as keyof typeof descriptions] || descriptions.recruiter;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mt-4">Loading portfolio...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Access Error</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <p className="text-sm text-muted-foreground">
                  The access link may have expired or been revoked. Please contact the portfolio owner for a new link.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!viewData) {
    return null;
  }

  const { profile, accessLevel, viewerEmail, viewerName } = viewData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto max-w-4xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{profile.title}</h1>
              <p className="text-muted-foreground">
                by {profile.user.name || profile.user.email}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1)} Access
              </Badge>
              <p className="text-sm text-muted-foreground">
                {viewerName || viewerEmail}
              </p>
            </div>
          </div>
          {profile.description && (
            <p className="text-muted-foreground mt-4 text-lg">
              {profile.description}
            </p>
          )}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Access Level:</strong> {getAccessLevelDescription(accessLevel)}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl p-6 space-y-6">
        {/* Projects Section */}
        {profile.workingProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Projects ({profile.workingProjects.length})
                {accessLevel === 'recruiter' && (
                  <Badge variant="outline" className="text-xs">Limited View</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.workingProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-6 bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {project.company && (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{project.company.name}</span>
                            {project.company.website && (
                              <a 
                                href={project.company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
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
                      <h4 className="font-medium mb-2">Overview</h4>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                  )}

                  {project.challenge && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Challenge</h4>
                      <p className="text-muted-foreground">{project.challenge}</p>
                    </div>
                  )}

                  {project.solution && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Solution</h4>
                      <p className="text-muted-foreground">{project.solution}</p>
                    </div>
                  )}

                  {project.impact && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Impact</h4>
                      <p className="text-muted-foreground">{project.impact}</p>
                    </div>
                  )}

                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Technologies</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, index) => (
                          <Badge key={index} variant="outline">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.workingMedia && project.workingMedia.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Media</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {project.workingMedia.map((media) => (
                          <div key={media.id} className="border rounded p-2">
                            <div className="text-xs text-muted-foreground mb-1">
                              {media.mediaType}
                            </div>
                            <div className="text-sm font-medium">
                              {media.title || 'Media'}
                            </div>
                            {media.description && (
                              <div className="text-xs text-muted-foreground">
                                {media.description}
                              </div>
                            )}
                          </div>
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
        {profile.workingAchievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Achievements ({profile.workingAchievements.length})
                {accessLevel === 'recruiter' && (
                  <Badge variant="outline" className="text-xs">Limited View</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profile.workingAchievements.map((achievement) => (
                <div key={achievement.id} className="border rounded-lg p-6 bg-white">
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
                      <p className="text-muted-foreground">{achievement.description}</p>
                    </div>
                  )}

                  {achievement.context && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Context</h4>
                      <p className="text-muted-foreground">{achievement.context}</p>
                    </div>
                  )}

                  {achievement.quantifiedImpact && achievement.quantifiedImpact.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Quantified Impact</h4>
                      <div className="grid gap-2">
                        {achievement.quantifiedImpact.map((metric, index) => (
                          <div key={index} className="flex gap-4 text-sm bg-gray-50 p-3 rounded">
                            <span className="font-medium">{metric.metric}:</span>
                            <span>{metric.value}</span>
                            <span className="text-green-600 font-medium">({metric.improvement})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {achievement.recognition && (
                    <div>
                      <h4 className="font-medium mb-2">Recognition</h4>
                      <p className="text-muted-foreground">{achievement.recognition}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">
            This portfolio is powered by Quest Core - Professional Development Platform
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Viewed via secure access token • Access level: {accessLevel}
          </div>
        </div>
      </div>
    </div>
  );
}