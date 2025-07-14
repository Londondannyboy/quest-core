import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update skill
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate skill exists
    const existingSkill = await prisma.skill.findUnique({
      where: { id }
    });

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Validate difficulty level if provided
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (body.difficulty && !validDifficulties.includes(body.difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 });
    }

    // Validate market demand if provided
    const validDemandLevels = ['low', 'medium', 'high', 'very_high'];
    if (body.marketDemand && !validDemandLevels.includes(body.marketDemand)) {
      return NextResponse.json({ error: 'Invalid market demand level' }, { status: 400 });
    }

    // Update skill
    const skill = await prisma.skill.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.category !== undefined && { category: body.category?.trim() || null }),
        ...(body.difficulty && { difficulty: body.difficulty }),
        ...(body.marketDemand && { marketDemand: body.marketDemand }),
        ...(body.isVerified !== undefined && { verified: body.isVerified })
      }
    });

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete skill
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if skill is being used
    const usageCount = await prisma.userSkill.count({
      where: { skillId: id }
    });

    if (usageCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete skill. It is being used by ${usageCount} user(s).` 
      }, { status: 400 });
    }

    await prisma.skill.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}