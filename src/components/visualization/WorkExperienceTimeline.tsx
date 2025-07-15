'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkExperience {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  company: {
    id: string;
    name: string;
    industry?: string;
  };
}

interface TimelineData {
  experiences: WorkExperience[];
}

export function WorkExperienceTimeline() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const fetchTimelineData = async () => {
    try {
      const response = await fetch('/api/visualization/work-timeline');
      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const calculateDuration = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
    
    if (years > 0 && months > 0) {
      return `${years}y ${months}m`;
    } else if (years > 0) {
      return `${years}y`;
    } else {
      return `${months}m`;
    }
  };

  const getTimelinePosition = (startDate: string | null, experiences: WorkExperience[]) => {
    if (!startDate) return 0;
    
    const allDates = experiences
      .filter(exp => exp.startDate)
      .map(exp => new Date(exp.startDate!).getTime());
    
    if (allDates.length === 0) return 0;
    
    const minDate = Math.min(...allDates);
    const maxDate = Math.max(...allDates, Date.now());
    const currentDate = new Date(startDate).getTime();
    
    return ((currentDate - minDate) / (maxDate - minDate)) * 100;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading timeline...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.experiences.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No work experience data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedExperiences = [...data.experiences].sort((a, b) => {
    const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Work Experience Timeline</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Timeline visualization */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {sortedExperiences.map((experience, index) => (
              <div key={experience.id} className="relative flex items-start space-x-4 pb-8">
                {/* Timeline marker */}
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                </div>
                
                {/* Experience content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{experience.title}</h3>
                        <p className="text-blue-600 font-medium">{experience.company.name}</p>
                        {experience.company.industry && (
                          <p className="text-sm text-gray-500">{experience.company.industry}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{formatDate(experience.startDate)} - {formatDate(experience.endDate)}</div>
                        <div className="font-medium">{calculateDuration(experience.startDate, experience.endDate)}</div>
                        {experience.isCurrent && (
                          <div className="text-green-600 font-medium">Current</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.experiences.length}</div>
              <div className="text-sm text-gray-500">Total Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(data.experiences.map(exp => exp.company.id)).size}
              </div>
              <div className="text-sm text-gray-500">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(data.experiences.map(exp => exp.company.industry).filter(Boolean)).size}
              </div>
              <div className="text-sm text-gray-500">Industries</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}