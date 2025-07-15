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
          position: { x: 0, y: -100, z: 0 }, // 2020 = 0 on X axis
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
          position: { x: 50000, y: 0, z: 0 }, // 2022 = 50000 on X axis
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
          position: { x: -50000, y: -200, z: 0 }, // 2018 = -50000 on X axis
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
          position: { x: 100000, y: 100, z: 0 }, // 2024 = 100000 on X axis
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