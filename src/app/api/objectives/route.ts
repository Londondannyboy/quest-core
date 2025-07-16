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
    console.log('Starting objective creation...');
    
    const { user } = await getOrCreateUser();
    console.log('User authenticated:', user.id);
    
    const body = await request.json();
    console.log('Request body:', body);

    const objectiveData = {
      userId: user.id,
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      priority: body.priority || null,
      timeframe: body.timeframe || null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      status: body.status || 'active'
    };
    
    console.log('Objective data to create:', objectiveData);

    const objective = await prisma.objective.create({
      data: objectiveData,
      include: {
        keyResults: true
      }
    });

    console.log('Objective created successfully:', objective.id);
    return NextResponse.json(objective, { status: 201 });
  } catch (error) {
    console.error('Error creating objective:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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