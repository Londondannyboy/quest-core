import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's commit batches
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, completed, archived
    const type = searchParams.get('type'); // voice_session, chat_session, document_upload, manual
    const limit = parseInt(searchParams.get('limit') || '20');

    const whereClause: any = { userId: user.id };
    if (status) whereClause.batchStatus = status;
    if (type) whereClause.batchType = type;

    const batches = await prisma.commitBatch.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        commits: {
          select: {
            id: true,
            extractionType: true,
            status: true,
            confidence: true,
            aiSummary: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Error fetching commit batches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new commit batch (typically from voice session or chat)
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();

    const {
      batchTitle,
      batchType,
      sessionSummary,
      aiInsights,
      sessionMetadata
    } = body;

    console.log(`Creating commit batch for user ${user.id}, type: ${batchType}`);

    const batch = await prisma.commitBatch.create({
      data: {
        userId: user.id,
        batchTitle,
        batchType,
        sessionSummary: sessionSummary || null,
        aiInsights: aiInsights || null,
        sessionMetadata: sessionMetadata || null,
        batchStatus: 'active'
      }
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating commit batch:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update commit batch
export async function PUT(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { id, batchStatus, sessionSummary, aiInsights } = body;

    // Verify user owns the batch
    const existingBatch = await prisma.commitBatch.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (batchStatus) updateData.batchStatus = batchStatus;
    if (sessionSummary) updateData.sessionSummary = sessionSummary;
    if (aiInsights) updateData.aiInsights = aiInsights;

    // Set completion timestamp if status is completed
    if (batchStatus === 'completed') {
      updateData.completedAt = new Date();
    }

    const batch = await prisma.commitBatch.update({
      where: { id },
      data: updateData,
      include: {
        commits: {
          select: {
            id: true,
            extractionType: true,
            status: true,
            confidence: true,
            aiSummary: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Error updating commit batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete commit batch and all its commits
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Batch ID required' }, { status: 400 });
    }

    // Verify user owns the batch
    const existingBatch = await prisma.commitBatch.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingBatch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Delete all commits in the batch first
    await prisma.conversationCommit.deleteMany({
      where: { batchId: id }
    });

    // Then delete the batch
    await prisma.commitBatch.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Error deleting commit batch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}