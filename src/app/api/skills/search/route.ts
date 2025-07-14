import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Search skills by name (for autocomplete with fuzzy matching)
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    
    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // Fuzzy search - matches if skill contains any part of the query
    const skills = await prisma.skill.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        difficultyLevel: true,
        verified: true
      },
      orderBy: [
        { verified: 'desc' }, // Verified skills first
        { name: 'asc' }
      ],
      take: 10
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error searching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new skill from user profile
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    // Check if skill already exists
    const existingSkill = await prisma.skill.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingSkill) {
      return NextResponse.json(existingSkill);
    }

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        category: category && typeof category === 'string' ? category.trim() : undefined,
        difficultyLevel: 'intermediate',
        verified: false // User-created skills start unverified
      }
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill from profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}