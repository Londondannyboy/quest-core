import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
// GET - Fetch user's personal repository
export async function GET() {
  try {
    const { user } = await getOrCreateUser();

    const userWithPersonal = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        personalGoals: {
          orderBy: { createdAt: 'desc' }
        },
        personalNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      goals: userWithPersonal?.personalGoals || [],
      notes: userWithPersonal?.personalNotes || []
    });

  } catch (error) {
    console.error('Error fetching personal repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/Update Personal Repository
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();

    const body = await request.json();
    const { goals, notes } = body;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Handle goals if provided
      if (goals) {
        // Delete existing goals and create new ones
        await tx.personalGoal.deleteMany({
          where: { userId: user.id }
        });

        if (goals.length > 0) {
          for (const goal of goals) {
            if (goal.title && goal.title.trim() !== '') {
              await tx.personalGoal.create({
                data: {
                  userId: user.id,
                  goalType: goal.goalType || undefined,
                  title: goal.title,
                  description: goal.description || undefined,
                  targetDate: goal.targetDate && goal.targetDate.trim() !== '' ? new Date(goal.targetDate) : null,
                  progressPercentage: goal.progressPercentage || 0,
                  okrs: goal.okrs || undefined
                }
              });
            }
          }
        }
      }

      // Handle notes if provided
      if (notes) {
        // For notes, we'll append new ones rather than replace
        for (const note of notes) {
          if (note.content && note.content.trim() !== '') {
            await tx.personalNote.create({
              data: {
                userId: user.id,
                noteType: note.noteType || 'reflection',
                content: note.content,
                tags: note.tags || undefined
              }
            });
          }
        }
      }

      return { success: true };
    });

    return NextResponse.json({ 
      message: 'Personal repository saved successfully',
      result 
    }, { status: 201 });

  } catch (error) {
    console.error('Error saving personal repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}