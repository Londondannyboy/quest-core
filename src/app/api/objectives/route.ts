import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's objectives with key results
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const whereClause: any = { userId: user.id };
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;

    const objectives = await prisma.objective.findMany({
      where: whereClause,
      include: {
        keyResults: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(objectives);
  } catch (error) {
    console.error('Error fetching objectives:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new objective
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();

    const objective = await prisma.objective.create({
      data: {
        userId: user.id,
        title: body.title,
        description: body.description,
        category: body.category,
        priority: body.priority,
        timeframe: body.timeframe,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        status: body.status || 'active'
      },
      include: {
        keyResults: true
      }
    });

    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    console.error('Error creating objective:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update objective
export async function PUT(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { id, ...updateData } = body;

    // Verify ownership
    const existingObjective = await prisma.objective.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingObjective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    const objective = await prisma.objective.update({
      where: { id },
      data: {
        ...updateData,
        targetDate: updateData.targetDate ? new Date(updateData.targetDate) : null,
        updatedAt: new Date()
      },
      include: {
        keyResults: true
      }
    });

    return NextResponse.json(objective);
  } catch (error) {
    console.error('Error updating objective:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete objective
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Objective ID required' }, { status: 400 });
    }

    // Verify ownership
    const existingObjective = await prisma.objective.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingObjective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    await prisma.objective.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Objective deleted successfully' });
  } catch (error) {
    console.error('Error deleting objective:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}