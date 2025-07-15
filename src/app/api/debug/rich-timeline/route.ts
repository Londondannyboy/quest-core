import { NextResponse } from 'next/server';

// Rich test data for comprehensive timeline visualization
export async function GET() {
  try {
    const richTimelineData = {
      nodes: [
        // 2018 - Foundation Year
        {
          id: 'stanford-cs',
          name: 'Stanford Computer Science',
          type: 'education',
          position: { x: -1200, y: -150, z: 0 },
          temporalMetadata: {
            t_valid: '2018-09-01T00:00:00.000Z',
            t_invalid: '2022-06-01T00:00:00.000Z',
            t_created: '2018-09-01T00:00:00.000Z',
            duration: 46,
            isActive: false
          },
          visualProperties: { color: '#DC2626', size: 10, opacity: 0.8 }
        },
        
        // 2019 - Skill Building
        {
          id: 'python-mastery',
          name: 'Python Programming',
          type: 'skill',
          position: { x: -800, y: -100, z: 0 },
          temporalMetadata: {
            t_valid: '2019-01-15T00:00:00.000Z',
            t_created: '2019-01-15T00:00:00.000Z',
            duration: 60,
            isActive: true
          },
          visualProperties: { color: '#2563EB', size: 8, opacity: 0.9 }
        },
        {
          id: 'data-structures',
          name: 'Data Structures & Algorithms',
          type: 'skill',
          position: { x: -800, y: 50, z: 0 },
          temporalMetadata: {
            t_valid: '2019-03-01T00:00:00.000Z',
            t_created: '2019-03-01T00:00:00.000Z',
            duration: 58,
            isActive: true
          },
          visualProperties: { color: '#2563EB', size: 7, opacity: 0.9 }
        },
        {
          id: 'google-intern',
          name: 'Google Summer Internship',
          type: 'job',
          position: { x: -800, y: -250, z: 0 },
          temporalMetadata: {
            t_valid: '2019-06-01T00:00:00.000Z',
            t_invalid: '2019-08-31T00:00:00.000Z',
            t_created: '2019-06-01T00:00:00.000Z',
            duration: 3,
            isActive: false
          },
          visualProperties: { color: '#059669', size: 9, opacity: 0.8 }
        },
        
        // 2020 - Web Development Focus
        {
          id: 'react-expert',
          name: 'React.js Expertise',
          type: 'skill',
          position: { x: -400, y: -50, z: 0 },
          temporalMetadata: {
            t_valid: '2020-02-01T00:00:00.000Z',
            t_created: '2020-02-01T00:00:00.000Z',
            duration: 48,
            isActive: true
          },
          visualProperties: { color: '#2563EB', size: 9, opacity: 0.9 }
        },
        {
          id: 'fullstack-bootcamp',
          name: 'Full-Stack Bootcamp',
          type: 'education',
          position: { x: -400, y: 100, z: 0 },
          temporalMetadata: {
            t_valid: '2020-05-01T00:00:00.000Z',
            t_invalid: '2020-08-01T00:00:00.000Z',
            t_created: '2020-05-01T00:00:00.000Z',
            duration: 3,
            isActive: false
          },
          visualProperties: { color: '#DC2626', size: 7, opacity: 0.8 }
        },
        {
          id: 'startup-dev',
          name: 'Startup Developer',
          type: 'job',
          position: { x: -400, y: -200, z: 0 },
          temporalMetadata: {
            t_valid: '2020-09-01T00:00:00.000Z',
            t_invalid: '2022-01-01T00:00:00.000Z',
            t_created: '2020-09-01T00:00:00.000Z',
            duration: 16,
            isActive: false
          },
          visualProperties: { color: '#059669', size: 8, opacity: 0.8 }
        },
        
        // 2021 - Project Year
        {
          id: 'ecommerce-platform',
          name: 'E-commerce Platform',
          type: 'project',
          position: { x: 0, y: -100, z: 0 },
          temporalMetadata: {
            t_valid: '2021-03-01T00:00:00.000Z',
            t_invalid: '2021-09-01T00:00:00.000Z',
            t_created: '2021-03-01T00:00:00.000Z',
            duration: 6,
            isActive: false
          },
          visualProperties: { color: '#7C3AED', size: 8, opacity: 0.8 }
        },
        {
          id: 'aws-cert',
          name: 'AWS Solutions Architect',
          type: 'certification',
          position: { x: 0, y: 50, z: 0 },
          temporalMetadata: {
            t_valid: '2021-07-15T00:00:00.000Z',
            t_created: '2021-07-15T00:00:00.000Z',
            duration: 36,
            isActive: true
          },
          visualProperties: { color: '#F59E0B', size: 6, opacity: 0.9 }
        },
        {
          id: 'mobile-app',
          name: 'React Native App',
          type: 'project',
          position: { x: 0, y: 150, z: 0 },
          temporalMetadata: {
            t_valid: '2021-10-01T00:00:00.000Z',
            t_invalid: '2021-12-31T00:00:00.000Z',
            t_created: '2021-10-01T00:00:00.000Z',
            duration: 3,
            isActive: false
          },
          visualProperties: { color: '#7C3AED', size: 7, opacity: 0.8 }
        },
        
        // 2022 - Career Growth
        {
          id: 'faang-engineer',
          name: 'Meta Senior Engineer',
          type: 'job',
          position: { x: 400, y: -150, z: 0 },
          temporalMetadata: {
            t_valid: '2022-02-01T00:00:00.000Z',
            t_invalid: '2023-12-01T00:00:00.000Z',
            t_created: '2022-02-01T00:00:00.000Z',
            duration: 22,
            isActive: false
          },
          visualProperties: { color: '#059669', size: 10, opacity: 0.8 }
        },
        {
          id: 'microservices',
          name: 'Microservices Architecture',
          type: 'skill',
          position: { x: 400, y: 0, z: 0 },
          temporalMetadata: {
            t_valid: '2022-04-01T00:00:00.000Z',
            t_created: '2022-04-01T00:00:00.000Z',
            duration: 32,
            isActive: true
          },
          visualProperties: { color: '#2563EB', size: 8, opacity: 0.9 }
        },
        {
          id: 'saas-platform',
          name: 'SaaS Analytics Platform',
          type: 'project',
          position: { x: 400, y: 120, z: 0 },
          temporalMetadata: {
            t_valid: '2022-08-01T00:00:00.000Z',
            t_invalid: '2023-02-01T00:00:00.000Z',
            t_created: '2022-08-01T00:00:00.000Z',
            duration: 6,
            isActive: false
          },
          visualProperties: { color: '#7C3AED', size: 9, opacity: 0.8 }
        },
        
        // 2023 - AI Specialization
        {
          id: 'ai-ml-mastery',
          name: 'AI/ML Specialization',
          type: 'skill',
          position: { x: 800, y: -100, z: 0 },
          temporalMetadata: {
            t_valid: '2023-01-01T00:00:00.000Z',
            t_created: '2023-01-01T00:00:00.000Z',
            duration: 24,
            isActive: true
          },
          visualProperties: { color: '#2563EB', size: 10, opacity: 1.0 }
        },
        {
          id: 'tensorflow-cert',
          name: 'TensorFlow Developer',
          type: 'certification',
          position: { x: 800, y: 50, z: 0 },
          temporalMetadata: {
            t_valid: '2023-05-01T00:00:00.000Z',
            t_created: '2023-05-01T00:00:00.000Z',
            duration: 20,
            isActive: true
          },
          visualProperties: { color: '#F59E0B', size: 7, opacity: 0.9 }
        },
        {
          id: 'ai-startup',
          name: 'AI Startup CTO',
          type: 'job',
          position: { x: 800, y: -250, z: 0 },
          temporalMetadata: {
            t_valid: '2023-09-01T00:00:00.000Z',
            t_created: '2023-09-01T00:00:00.000Z',
            duration: 16,
            isActive: true
          },
          visualProperties: { color: '#059669', size: 11, opacity: 1.0 }
        },
        
        // 2024 - Current Projects
        {
          id: 'quest-core-platform',
          name: 'Quest Core Platform',
          type: 'project',
          position: { x: 1200, y: -50, z: 0 },
          temporalMetadata: {
            t_valid: '2024-01-01T00:00:00.000Z',
            t_created: '2024-01-01T00:00:00.000Z',
            duration: 12,
            isActive: true
          },
          visualProperties: { color: '#7C3AED', size: 12, opacity: 1.0 }
        },
        {
          id: 'temporal-graphs',
          name: '3D Temporal Visualization',
          type: 'skill',
          position: { x: 1200, y: 100, z: 0 },
          temporalMetadata: {
            t_valid: '2024-07-01T00:00:00.000Z',
            t_created: '2024-07-01T00:00:00.000Z',
            duration: 6,
            isActive: true
          },
          visualProperties: { color: '#2563EB', size: 9, opacity: 1.0 }
        }
      ],
      links: [
        // Education to Skills
        { source: 'stanford-cs', target: 'python-mastery', type: 'education_to_skill', strength: 0.9, temporalMetadata: { t_valid: '2019-01-15T00:00:00.000Z', overlapDuration: 40 } },
        { source: 'stanford-cs', target: 'data-structures', type: 'education_to_skill', strength: 0.8, temporalMetadata: { t_valid: '2019-03-01T00:00:00.000Z', overlapDuration: 38 } },
        
        // Skills to Jobs
        { source: 'python-mastery', target: 'google-intern', type: 'skill_to_job', strength: 0.9, temporalMetadata: { t_valid: '2019-06-01T00:00:00.000Z', overlapDuration: 3 } },
        { source: 'data-structures', target: 'google-intern', type: 'skill_to_job', strength: 0.8, temporalMetadata: { t_valid: '2019-06-01T00:00:00.000Z', overlapDuration: 3 } },
        { source: 'react-expert', target: 'startup-dev', type: 'skill_to_job', strength: 1.0, temporalMetadata: { t_valid: '2020-09-01T00:00:00.000Z', overlapDuration: 16 } },
        
        // Job to Project
        { source: 'startup-dev', target: 'ecommerce-platform', type: 'job_to_project', strength: 0.9, temporalMetadata: { t_valid: '2021-03-01T00:00:00.000Z', overlapDuration: 6 } },
        { source: 'faang-engineer', target: 'saas-platform', type: 'job_to_project', strength: 0.8, temporalMetadata: { t_valid: '2022-08-01T00:00:00.000Z', overlapDuration: 6 } },
        { source: 'ai-startup', target: 'quest-core-platform', type: 'job_to_project', strength: 1.0, temporalMetadata: { t_valid: '2024-01-01T00:00:00.000Z', overlapDuration: 12 } },
        
        // Skill Development Chain
        { source: 'python-mastery', target: 'react-expert', type: 'skill_progression', strength: 0.7, temporalMetadata: { t_valid: '2020-02-01T00:00:00.000Z', overlapDuration: 12 } },
        { source: 'react-expert', target: 'microservices', type: 'skill_progression', strength: 0.8, temporalMetadata: { t_valid: '2022-04-01T00:00:00.000Z', overlapDuration: 24 } },
        { source: 'microservices', target: 'ai-ml-mastery', type: 'skill_progression', strength: 0.9, temporalMetadata: { t_valid: '2023-01-01T00:00:00.000Z', overlapDuration: 8 } },
        { source: 'ai-ml-mastery', target: 'temporal-graphs', type: 'skill_progression', strength: 1.0, temporalMetadata: { t_valid: '2024-07-01T00:00:00.000Z', overlapDuration: 6 } },
        
        // Career Progression
        { source: 'google-intern', target: 'startup-dev', type: 'career_progression', strength: 0.7, temporalMetadata: { t_valid: '2020-09-01T00:00:00.000Z', overlapDuration: 0 } },
        { source: 'startup-dev', target: 'faang-engineer', type: 'career_progression', strength: 0.8, temporalMetadata: { t_valid: '2022-02-01T00:00:00.000Z', overlapDuration: 0 } },
        { source: 'faang-engineer', target: 'ai-startup', type: 'career_progression', strength: 0.9, temporalMetadata: { t_valid: '2023-09-01T00:00:00.000Z', overlapDuration: 0 } },
        
        // Project Evolution
        { source: 'ecommerce-platform', target: 'mobile-app', type: 'project_evolution', strength: 0.6, temporalMetadata: { t_valid: '2021-10-01T00:00:00.000Z', overlapDuration: 0 } },
        { source: 'mobile-app', target: 'saas-platform', type: 'project_evolution', strength: 0.7, temporalMetadata: { t_valid: '2022-08-01T00:00:00.000Z', overlapDuration: 0 } },
        { source: 'saas-platform', target: 'quest-core-platform', type: 'project_evolution', strength: 0.9, temporalMetadata: { t_valid: '2024-01-01T00:00:00.000Z', overlapDuration: 0 } }
      ],
      timeRange: {
        start: '2018-09-01T00:00:00.000Z',
        end: '2024-12-31T23:59:59.999Z'
      }
    };

    return NextResponse.json({
      success: true,
      data: richTimelineData,
      meta: {
        userId: 'test-rich-user',
        timeRange: null,
        nodeCount: richTimelineData.nodes.length,
        linkCount: richTimelineData.links.length,
        debug: true,
        description: 'Comprehensive 6-year professional timeline with 18 nodes and 16 links'
      }
    });

  } catch (error) {
    console.error('Rich timeline error:', error);
    return NextResponse.json(
      { error: 'Rich timeline endpoint failed' },
      { status: 500 }
    );
  }
}