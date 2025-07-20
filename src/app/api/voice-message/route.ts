import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, role, content, timestamp } = await request.json();
    
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 });
    }
    
    // Find or create conversation for this voice session
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: userId,
        sessionId: sessionId
      }
    });
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: userId,
          sessionId: sessionId,
          title: 'Voice Coaching Session',
          type: 'voice_coaching'
        }
      });
    }
    
    // Store the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: role, // 'user' or 'assistant'
        content: content,
        createdAt: new Date(timestamp)
      }
    });
    
    return NextResponse.json({
      success: true,
      messageId: message.id,
      conversationId: conversation.id
    });
    
  } catch (error) {
    console.error('[Voice Message] Error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to store voice message'
    }, { status: 500 });
  }
}