'use client';

import { useAuth } from '@clerk/nextjs';
import { WorkExperienceTimeline } from '@/components/visualization/WorkExperienceTimeline';
import { Card, CardContent } from '@/components/ui/card';

export default function VisualizationPage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
              <p className="text-muted-foreground">
                Please sign in to view your professional timeline visualization.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Timeline</h1>
        <p className="text-muted-foreground">
          Visualize your career journey and professional growth over time
        </p>
      </div>

      <div className="space-y-8">
        {/* Work Experience Timeline */}
        <WorkExperienceTimeline />

        {/* Future: Skills Timeline, Graph Visualization, etc. */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p>Skills progression, network graphs, and more visualizations</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}