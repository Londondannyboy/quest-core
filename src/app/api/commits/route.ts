import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's conversation commits
export async function GET(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, committed
    const batchId = searchParams.get('batchId');
    const type = searchParams.get('type'); // skill, experience, education, objective, key_result
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: any = { userId: user.id };
    if (status) whereClause.status = status;
    if (batchId) whereClause.batchId = batchId;
    if (type) whereClause.extractionType = type;

    const commits = await prisma.conversationCommit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        batch: {
          select: {
            id: true,
            batchTitle: true,
            batchType: true,
            sessionSummary: true,
            createdAt: true
          }
        }
      }
    });

    return NextResponse.json(commits);
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new conversation commit (from AI analysis)
export async function POST(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();

    const {
      batchId,
      extractionType,
      confidence,
      aiSummary,
      originalText,
      extractedData,
      targetLayer,
      conversationId
    } = body;

    console.log(`Creating commit for user ${user.id}, type: ${extractionType}`);

    const commit = await prisma.conversationCommit.create({
      data: {
        userId: user.id,
        batchId: batchId || null,
        extractionType,
        confidence,
        aiSummary,
        originalText,
        extractedData,
        targetLayer,
        conversationId: conversationId || null,
        status: 'pending'
      },
      include: {
        batch: {
          select: {
            id: true,
            batchTitle: true,
            batchType: true
          }
        }
      }
    });

    // Update batch counters if applicable
    if (batchId) {
      await prisma.commitBatch.update({
        where: { id: batchId },
        data: {
          totalCommits: { increment: 1 },
          pendingCommits: { increment: 1 }
        }
      });
    }

    return NextResponse.json(commit, { status: 201 });
  } catch (error) {
    console.error('Error creating commit:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update commit status (approve, reject, edit)
export async function PUT(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const body = await request.json();
    const { id, status, suggestedEdits, reviewNotes, commitMessage } = body;

    // Verify user owns the commit
    const existingCommit = await prisma.conversationCommit.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingCommit) {
      return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
    }

    const oldStatus = existingCommit.status;
    const now = new Date();

    const updateData: any = {
      status,
      updatedAt: now
    };

    if (suggestedEdits) updateData.suggestedEdits = suggestedEdits;
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (commitMessage) updateData.commitMessage = commitMessage;

    // Set review timestamp if status is changing from pending
    if (oldStatus === 'pending' && status !== 'pending') {
      updateData.reviewedAt = now;
    }

    // Set commit timestamp if status is committed
    if (status === 'committed') {
      updateData.committedAt = now;
    }

    const commit = await prisma.conversationCommit.update({
      where: { id },
      data: updateData,
      include: {
        batch: {
          select: {
            id: true,
            batchTitle: true,
            batchType: true
          }
        }
      }
    });

    // Update batch counters if applicable
    if (existingCommit.batchId && oldStatus !== status) {
      const batchUpdate: any = {};
      
      // Decrement old status counter
      if (oldStatus === 'pending') batchUpdate.pendingCommits = { decrement: 1 };
      else if (oldStatus === 'approved') batchUpdate.approvedCommits = { decrement: 1 };
      else if (oldStatus === 'rejected') batchUpdate.rejectedCommits = { decrement: 1 };
      else if (oldStatus === 'committed') batchUpdate.committedCommits = { decrement: 1 };

      // Increment new status counter
      if (status === 'pending') batchUpdate.pendingCommits = { increment: 1 };
      else if (status === 'approved') batchUpdate.approvedCommits = { increment: 1 };
      else if (status === 'rejected') batchUpdate.rejectedCommits = { increment: 1 };
      else if (status === 'committed') batchUpdate.committedCommits = { increment: 1 };

      await prisma.commitBatch.update({
        where: { id: existingCommit.batchId },
        data: batchUpdate
      });
    }

    return NextResponse.json(commit);
  } catch (error) {
    console.error('Error updating commit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete commit
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Commit ID required' }, { status: 400 });
    }

    // Verify user owns the commit
    const existingCommit = await prisma.conversationCommit.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingCommit) {
      return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
    }

    await prisma.conversationCommit.delete({
      where: { id }
    });

    // Update batch counters if applicable
    if (existingCommit.batchId) {
      const batchUpdate: any = {
        totalCommits: { decrement: 1 }
      };

      if (existingCommit.status === 'pending') batchUpdate.pendingCommits = { decrement: 1 };
      else if (existingCommit.status === 'approved') batchUpdate.approvedCommits = { decrement: 1 };
      else if (existingCommit.status === 'rejected') batchUpdate.rejectedCommits = { decrement: 1 };
      else if (existingCommit.status === 'committed') batchUpdate.committedCommits = { decrement: 1 };

      await prisma.commitBatch.update({
        where: { id: existingCommit.batchId },
        data: batchUpdate
      });
    }

    return NextResponse.json({ message: 'Commit deleted successfully' });
  } catch (error) {
    console.error('Error deleting commit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}