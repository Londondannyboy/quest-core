import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { QuestZepClient } from '@/lib/zep-client';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, role, content, metadata } = await request.json();
    console.log('[Zep Message] Storing message:', { sessionId, role, contentLength: content.length });
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      console.log('[Zep Message] No authenticated user');
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    console.log('[Zep Message] Authenticated user:', userId);
    
    // Initialize Zep client
    const zepClient = new QuestZepClient();
    
    // First, ensure session exists in Zep
    try {
      await zepClient.createSession(userId, sessionId, metadata?.sessionType || 'voice_coaching');
    } catch (error) {
      // Session might already exist, that's okay
      console.log('[Zep] Session already exists or other error:', error);
    }
    
    // Add message to Zep memory with userId in metadata for fact extraction
    await zepClient.addMessage(sessionId, role, content, {
      ...metadata,
      userId // Include userId for user metadata updates
    });
    
    console.log('[Zep] Message stored:', { userId, sessionId, role, contentLength: content.length });
    
    return NextResponse.json({
      success: true,
      sessionId,
      message: 'Message stored in Zep memory'
    });
    
  } catch (error) {
    console.error('[Zep Message] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to store message in Zep'
    }, { status: 500 });
  }
}