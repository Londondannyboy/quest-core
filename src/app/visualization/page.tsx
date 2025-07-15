'use client';

import { useAuth } from '@clerk/nextjs';
import { WorkExperienceTimeline } from '@/components/visualization/WorkExperienceTimeline';
import { ProfessionalNetworkGraph } from '@/components/visualization/ProfessionalNetworkGraph';
import { ConversationGraphTest } from '@/components/conversation/ConversationGraphTest';
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
                Please sign in to view your professional visualizations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Visualizations</h1>
        <p className="text-muted-foreground">
          Explore your career journey through interactive timelines and 3D network graphs
        </p>
      </div>

      <div className="space-y-8">
        {/* Conversation Graph Test */}
        <ConversationGraphTest />

        {/* 3D Professional Network Graph */}
        <ProfessionalNetworkGraph />

        {/* Work Experience Timeline */}
        <WorkExperienceTimeline />

        {/* Future: Skills Timeline, etc. */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p>Skills progression over time, career path predictions, and Neo4j-powered relationship intelligence</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}