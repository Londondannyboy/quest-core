import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all skills
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        category: true,
        difficultyLevel: true,
        marketDemandScore: true,
        verified: true,
        createdAt: true,
        _count: {
          select: {
            userSkills: true
          }
        }
      }
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new skill
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, category, difficulty, marketDemand } = body;

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
      return NextResponse.json({ error: 'Skill with this name already exists' }, { status: 409 });
    }

    // Validate difficulty level
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    // Validate market demand
    const validDemandLevels = ['low', 'medium', 'high', 'very_high'];
    if (marketDemand && !validDemandLevels.includes(marketDemand)) {
      return NextResponse.json({ error: 'Invalid market demand level' }, { status: 400 });
    }

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        category: category && typeof category === 'string' ? category.trim() : undefined,
        difficultyLevel: difficulty || 'intermediate',
        marketDemandScore: marketDemand ? parseInt(marketDemand) : 3,
        verified: false
      }
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}