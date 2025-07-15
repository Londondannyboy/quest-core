import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { user } = await getOrCreateUser();

    // Fetch user's work experiences with company information
    const workExperiences = await prisma.workExperience.findMany({
      where: {
        userId: user.id
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Transform the data for the timeline
    const timelineData = {
      experiences: workExperiences.map(exp => ({
        id: exp.id,
        title: exp.title,
        startDate: exp.startDate ? exp.startDate.toISOString() : null,
        endDate: exp.endDate ? exp.endDate.toISOString() : null,
        isCurrent: exp.isCurrent,
        description: exp.description,
        company: {
          id: exp.company.id,
          name: exp.company.name,
          industry: exp.company.industry,
          website: exp.company.website
        }
      }))
    };

    return NextResponse.json(timelineData);

  } catch (error) {
    console.error('Error fetching work timeline data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work timeline data' },
      { status: 500 }
    );
  }
}