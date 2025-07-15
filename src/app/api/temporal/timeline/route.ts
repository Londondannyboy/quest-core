import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { TemporalGraphManager } from '@/lib/temporal-graph';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();
    const { searchParams } = new URL(request.url);
    
    // Optional time range filtering
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let timeRange: { start: Date; end: Date } | undefined;
    if (startDate && endDate) {
      timeRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Initialize temporal schema if needed
    await TemporalGraphManager.initializeTemporalSchema();

    // Get temporal timeline data
    const timelineData = await TemporalGraphManager.getTemporalTimeline(
      user.user.id,
      timeRange
    );

    return NextResponse.json({
      success: true,
      data: timelineData,
      meta: {
        userId: user.user.id,
        timeRange: timeRange || null,
        nodeCount: timelineData.nodes.length,
        linkCount: timelineData.links.length
      }
    });

  } catch (error) {
    console.error('Error fetching temporal timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch temporal timeline' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();
    const body = await request.json();

    // Add temporal event
    const temporalEvent = {
      id: `${body.type}-${Date.now()}`,
      type: body.type,
      userId: user.user.id,
      entityId: body.entityId,
      entityName: body.entityName,
      metadata: body.metadata || {},
      t_valid: new Date(body.t_valid || Date.now()),
      t_invalid: body.t_invalid ? new Date(body.t_invalid) : undefined,
      t_created: new Date()
    };

    await TemporalGraphManager.addTemporalEvent(temporalEvent);

    return NextResponse.json({
      success: true,
      data: temporalEvent,
      message: 'Temporal event added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding temporal event:', error);
    return NextResponse.json(
      { error: 'Failed to add temporal event' },
      { status: 500 }
    );
  }
}