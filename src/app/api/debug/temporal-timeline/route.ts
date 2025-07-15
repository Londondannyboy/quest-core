import { NextResponse } from 'next/server';

// Debug endpoint for testing temporal timeline without authentication
export async function GET() {
  try {
    // Return sample temporal timeline data for testing
    const sampleTimelineData = {
      nodes: [
        {
          id: 'skill-typescript',
          name: 'TypeScript',
          type: 'skill',
          position: { x: 50, y: 100, z: -200 },
          temporalMetadata: {
            t_valid: '2020-01-01T00:00:00.000Z',
            t_created: '2020-01-01T00:00:00.000Z',
            duration: 48,
            isActive: true
          },
          visualProperties: {
            color: '#3b82f6',
            size: 5,
            opacity: 0.8
          }
        },
        {
          id: 'job-software-engineer',
          name: 'Software Engineer',
          type: 'job',
          position: { x: 75, y: 150, z: -100 },
          temporalMetadata: {
            t_valid: '2022-01-01T00:00:00.000Z',
            t_created: '2022-01-01T00:00:00.000Z',
            duration: 24,
            isActive: true
          },
          visualProperties: {
            color: '#10b981',
            size: 8,
            opacity: 0.9
          }
        },
        {
          id: 'education-computer-science',
          name: 'Computer Science Degree',
          type: 'education',
          position: { x: 25, y: 75, z: -300 },
          temporalMetadata: {
            t_valid: '2018-09-01T00:00:00.000Z',
            t_invalid: '2022-05-01T00:00:00.000Z',
            t_created: '2018-09-01T00:00:00.000Z',
            duration: 44,
            isActive: false
          },
          visualProperties: {
            color: '#f59e0b',
            size: 6,
            opacity: 0.7
          }
        },
        {
          id: 'project-quest-core',
          name: 'Quest Core Platform',
          type: 'project',
          position: { x: 100, y: 175, z: 0 },
          temporalMetadata: {
            t_valid: '2024-01-01T00:00:00.000Z',
            t_created: '2024-01-01T00:00:00.000Z',
            duration: 12,
            isActive: true
          },
          visualProperties: {
            color: '#8b5cf6',
            size: 7,
            opacity: 0.9
          }
        }
      ],
      links: [
        {
          source: 'skill-typescript',
          target: 'job-software-engineer',
          type: 'skill_to_job',
          strength: 0.8,
          temporalMetadata: {
            t_valid: '2022-01-01T00:00:00.000Z',
            overlapDuration: 24
          }
        },
        {
          source: 'education-computer-science',
          target: 'skill-typescript',
          type: 'education_to_skill',
          strength: 0.6,
          temporalMetadata: {
            t_valid: '2020-01-01T00:00:00.000Z',
            overlapDuration: 28
          }
        },
        {
          source: 'job-software-engineer',
          target: 'project-quest-core',
          type: 'job_to_project',
          strength: 0.9,
          temporalMetadata: {
            t_valid: '2024-01-01T00:00:00.000Z',
            overlapDuration: 12
          }
        }
      ],
      timeRange: {
        start: '2018-01-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      }
    };

    return NextResponse.json({
      success: true,
      data: sampleTimelineData,
      meta: {
        userId: 'debug-user',
        timeRange: null,
        nodeCount: sampleTimelineData.nodes.length,
        linkCount: sampleTimelineData.links.length,
        debug: true
      }
    });

  } catch (error) {
    console.error('Debug temporal timeline error:', error);
    return NextResponse.json(
      { error: 'Debug endpoint failed' },
      { status: 500 }
    );
  }
}