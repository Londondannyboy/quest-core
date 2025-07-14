import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's personal repository
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        personalGoals: {
          orderBy: { createdAt: 'desc' }
        },
        personalNotes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      goals: user.personalGoals || [],
      notes: user.personalNotes || []
    });

  } catch (error) {
    console.error('Error fetching personal repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/Update Personal Repository
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goals, notes } = body;

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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