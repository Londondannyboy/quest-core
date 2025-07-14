'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@clerk/nextjs';
import { Badge } from '@/components/ui/badge';
import { CompanySearch } from '@/components/ui/company-search';
import { SkillSearch } from '@/components/ui/skill-search';
import { EducationSearch } from '@/components/ui/education-search';

interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
}

interface Skill {
  id: string;
  name: string;
  category?: string;
  difficulty?: string;
}

interface Institution {
  id: string;
  name: string;
  type?: string;
  country?: string;
}

interface WorkExperience {
  id?: string;
  companyId: string;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentRole: boolean;
}

interface Education {
  id?: string;
  institutionId: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  grade?: string;
}

interface UserSkill {
  id?: string;
  skillId: string;
  yearsOfExperience: number;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  isShowcase: boolean;
}

export default function ProfileSetupPage() {
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  const [profileData, setProfileData] = useState({
    headline: '',
    location: '',
    about: ''
  });

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([{
    companyId: '',
    companyName: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    isCurrentRole: false
  }]);

  const [educations, setEducations] = useState<Education[]>([{
    institutionId: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    grade: ''
  }]);

  const [userSkills, setUserSkills] = useState<UserSkill[]>([{
    skillId: '',
    yearsOfExperience: 1,
    proficiencyLevel: 'intermediate',
    isShowcase: true
  }]);

  useEffect(() => {
    if (isSignedIn) {
      fetchEntities();
    }
  }, [isSignedIn]);

  const fetchEntities = async () => {
    try {
      const [companiesRes, skillsRes, institutionsRes] = await Promise.all([
        fetch('/api/admin/entities/companies'),
        fetch('/api/admin/entities/skills'),
        fetch('/api/admin/entities/education')
      ]);

      const [companiesData, skillsData, institutionsData] = await Promise.all([
        companiesRes.ok ? companiesRes.json() : [],
        skillsRes.ok ? skillsRes.json() : [],
        institutionsRes.ok ? institutionsRes.json() : []
      ]);

      setCompanies(companiesData);
      setSkills(skillsData);
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error fetching entities:', error);
    }
  };

  const addWorkExperience = () => {
    setWorkExperiences(prev => [...prev, {
      companyId: '',
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrentRole: false
    }]);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperiences(prev => prev.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    setWorkExperiences(prev => prev.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  const addEducation = () => {
    setEducations(prev => [...prev, {
      institutionId: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      grade: ''
    }]);
  };

  const removeEducation = (index: number) => {
    setEducations(prev => prev.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    setEducations(prev => prev.map((edu, i) => 
      i === index ? { ...edu, [field]: value } : edu
    ));
  };

  const addSkill = () => {
    setUserSkills(prev => [...prev, {
      skillId: '',
      yearsOfExperience: 1,
      proficiencyLevel: 'intermediate',
      isShowcase: true
    }]);
  };

  const removeSkill = (index: number) => {
    setUserSkills(prev => prev.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof UserSkill, value: any) => {
    setUserSkills(prev => prev.map((skill, i) => 
      i === index ? { ...skill, [field]: value } : skill
    ));
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/surface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profileData,
          workExperiences: workExperiences.filter(exp => exp.companyId && exp.position),
          // TEMPORARILY DISABLED - Education and Skills
          educations: [],
          skills: []
        })
      });

      if (response.ok) {
        alert('Profile saved successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message || 'Failed to save profile'}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please sign in to create your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Setup Your Surface Profile</h1>
        <p className="text-muted-foreground">Create your public LinkedIn-style professional profile</p>
      </div>

      {/* Basic Profile Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Professional Headline</label>
            <Input
              value={profileData.headline}
              onChange={(e) => setProfileData(prev => ({ ...prev, headline: e.target.value }))}
              placeholder="e.g., Senior Software Engineer at Tech Company"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Location</label>
            <Input
              value={profileData.location}
              onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., San Francisco, CA"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">About</label>
            <textarea
              value={profileData.about}
              onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
              placeholder="Write a brief professional summary..."
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Work Experience</CardTitle>
            <Button onClick={addWorkExperience} variant="outline" size="sm">
              Add Experience
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {workExperiences.map((exp, index) => (
            <div key={index} className="border rounded-lg p-4 relative">
              {workExperiences.length > 1 && (
                <Button
                  onClick={() => removeWorkExperience(index)}
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  Remove
                </Button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Company *</label>
                  <select
                    value={exp.companyId}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      updateWorkExperience(index, 'companyId', selectedValue);
                      // Set company name based on selection
                      const companyNames: Record<string, string> = {
                        'test-company-1': 'Tech Corp Ltd',
                        'test-company-2': 'StartupXYZ', 
                        'test-company-3': 'BigCorp Inc'
                      };
                      updateWorkExperience(index, 'companyName', companyNames[selectedValue] || '');
                    }}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select company</option>
                    {companies.length === 0 ? (
                      <>
                        <option value="test-company-1">Tech Corp Ltd</option>
                        <option value="test-company-2">StartupXYZ</option>
                        <option value="test-company-3">BigCorp Inc</option>
                      </>
                    ) : (
                      companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Position *</label>
                  <Input
                    value={exp.position}
                    onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date *</label>
                  <Input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                    disabled={exp.isCurrentRole}
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exp.isCurrentRole}
                    onChange={(e) => updateWorkExperience(index, 'isCurrentRole', e.target.checked)}
                  />
                  <span className="text-sm">I currently work here</span>
                </label>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                  placeholder="Describe your role and achievements..."
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* TEMPORARILY DISABLED - Education and Skills */}
      {/* TODO: Re-enable once core profile saving is working */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Education & Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Education and skills sections are temporarily disabled while we fix profile saving.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Focus on work experience for now - we&apos;ll add these back soon!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveProfile} disabled={loading} size="lg">
          {loading ? 'Saving...' : 'Save Surface Profile'}
        </Button>
      </div>
    </div>
  );
}