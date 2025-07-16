import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch key results for an objective
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const objectiveId = searchParams.get('objectiveId');

    if (!objectiveId) {
      return NextResponse.json({ error: 'Objective ID required' }, { status: 400 });
    }

    // Verify user owns the objective
    const objective = await prisma.objective.findFirst({
      where: { id: objectiveId, userId: user.id }
    });

    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    const keyResults = await prisma.keyResult.findMany({
      where: { objectiveId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(keyResults);
  } catch (error) {
    console.error('Error fetching key results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new key result
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();

    // Verify user owns the objective
    const objective = await prisma.objective.findFirst({
      where: { id: body.objectiveId, userId: user.id }
    });

    if (!objective) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    const keyResult = await prisma.keyResult.create({
      data: {
        objectiveId: body.objectiveId,
        title: body.title,
        description: body.description,
        measurementType: body.measurementType,
        targetValue: body.targetValue,
        currentValue: body.currentValue || 0,
        unit: body.unit,
        status: body.status || 'active',
        dueDate: body.dueDate ? new Date(body.dueDate) : null
      }
    });

    return NextResponse.json(keyResult, { status: 201 });
  } catch (error) {
    console.error('Error creating key result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update key result
export async function PUT(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { id, ...updateData } = body;

    // Verify user owns the key result through objective
    const existingKeyResult = await prisma.keyResult.findFirst({
      where: { id },
      include: { objective: true }
    });

    if (!existingKeyResult || existingKeyResult.objective.userId !== user.id) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 });
    }

    // Check if being marked as completed
    const completedAt = updateData.status === 'completed' && existingKeyResult.status !== 'completed' 
      ? new Date() 
      : existingKeyResult.completedAt;

    const keyResult = await prisma.keyResult.update({
      where: { id },
      data: {
        ...updateData,
        completedAt,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : null,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(keyResult);
  } catch (error) {
    console.error('Error updating key result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete key result
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Key result ID required' }, { status: 400 });
    }

    // Verify user owns the key result through objective
    const existingKeyResult = await prisma.keyResult.findFirst({
      where: { id },
      include: { objective: true }
    });

    if (!existingKeyResult || existingKeyResult.objective.userId !== user.id) {
      return NextResponse.json({ error: 'Key result not found' }, { status: 404 });
    }

    await prisma.keyResult.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Key result deleted successfully' });
  } catch (error) {
    console.error('Error deleting key result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}