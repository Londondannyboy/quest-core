'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

interface SurfaceProfile {
  headline?: string;
  location?: string;
  about?: string;
}

interface WorkExperience {
  id: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentRole: boolean;
  company: {
    name: string;
    website?: string;
    industry?: string;
  };
}

interface Education {
  id: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  institution: {
    name: string;
    type?: string;
    country?: string;
  };
}

interface UserSkill {
  id: string;
  yearsOfExperience: number;
  proficiencyLevel: string;
  skill: {
    name: string;
    category?: string;
  };
}

interface ProfileData {
  profile?: SurfaceProfile;
  workExperiences: WorkExperience[];
  education: Education[];
  skills: UserSkill[];
}

export default function ProfilePage() {
  const { isSignedIn } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchProfile();
    }
  }, [isSignedIn]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/surface');
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to view your profile.</p>
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
            <p className="text-center text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData?.profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground mb-4">You haven't created your Surface profile yet.</p>
            <Link href="/profile/setup">
              <Button>Create Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Your Surface Profile</h1>
          <p className="text-muted-foreground">Public LinkedIn-style professional profile</p>
        </div>
        <Link href="/profile/setup">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      </div>

      {/* Basic Profile Info */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {profileData.profile.headline && (
              <div>
                <h2 className="text-xl font-semibold">{profileData.profile.headline}</h2>
              </div>
            )}
            {profileData.profile.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{profileData.profile.location}</span>
              </div>
            )}
            {profileData.profile.about && (
              <div>
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed">{profileData.profile.about}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      {profileData.workExperiences.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Work Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {profileData.workExperiences.map((exp) => (
                <div key={exp.id} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{exp.position}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-blue-600 font-medium">{exp.company.name}</p>
                        {exp.company.industry && (
                          <Badge variant="outline" className="text-xs">
                            {exp.company.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {exp.isCurrentRole && (
                      <Badge className="bg-green-100 text-green-800">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(exp.startDate)} - {exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                  </p>
                  {exp.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education */}
      {profileData.education.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profileData.education.map((edu) => (
                <div key={edu.id} className="border-l-2 border-purple-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{edu.degree}</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-purple-600 font-medium">{edu.institution.name}</p>
                        {edu.institution.type && (
                          <Badge variant="outline" className="text-xs">
                            {edu.institution.type.replace('_', ' ')}
                          </Badge>
                        )}
                        {edu.institution.country && (
                          <Badge variant="outline" className="text-xs">
                            {edu.institution.country}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {edu.grade && (
                      <Badge variant="secondary">{edu.grade}</Badge>
                    )}
                  </div>
                  {edu.fieldOfStudy && (
                    <p className="text-sm text-muted-foreground mb-1">{edu.fieldOfStudy}</p>
                  )}
                  {(edu.startDate || edu.endDate) && (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {profileData.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileData.skills.map((userSkill) => (
                <div key={userSkill.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{userSkill.skill.name}</h3>
                    <Badge className={`text-xs ${getProficiencyColor(userSkill.proficiencyLevel)}`}>
                      {userSkill.proficiencyLevel}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>{userSkill.yearsOfExperience} year{userSkill.yearsOfExperience !== 1 ? 's' : ''} experience</p>
                    {userSkill.skill.category && (
                      <p className="text-xs">{userSkill.skill.category}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {profileData.workExperiences.length === 0 && 
       profileData.education.length === 0 && 
       profileData.skills.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Your profile is missing work experience, education, and skills.</p>
            <Link href="/profile/setup">
              <Button>Complete Profile</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}