import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const zepClient = new QuestZepClient();
    
    // Get current user data
    const userSummary = await zepClient.getUserSummary(userId);
    const currentFacts = userSummary?.metadata?.facts || [];
    
    // Clear facts from user metadata
    await zepClient.zep.user.update(userId, {
      metadata: {
        ...userSummary?.metadata,
        facts: [], // Clear all facts
        lastCleared: new Date().toISOString()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'User facts cleared',
      clearedFacts: currentFacts.length,
      userId
    });
    
  } catch (error) {
    console.error('[Zep Clear Facts] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to clear facts'
    }, { status: 500 });
  }
}