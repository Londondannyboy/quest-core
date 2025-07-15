import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getOrCreateUser } from '@/lib/auth-helpers';
import { ConversationParser } from '@/lib/conversation-parser';

// POST - Parse conversation input and trigger graph updates
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser();
    const body = await request.json();
    const { input } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    // Parse the conversation input
    const actions = ConversationParser.parseUserInput(input);
    
    // Process the actions (broadcast to WebSocket clients)
    await ConversationParser.processConversationActions(user.user.id, actions);

    return NextResponse.json({
      input,
      actions,
      message: `Parsed ${actions.length} actions from conversation`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error parsing conversation:', error);
    return NextResponse.json({ 
      error: 'Failed to parse conversation',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET - Test endpoint for conversation parsing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testInput = searchParams.get('input') || "I'm skilled in JavaScript and React, and I work at Meta as a Senior Developer";
    
    const actions = ConversationParser.parseUserInput(testInput);
    
    return NextResponse.json({
      testInput,
      actions,
      message: `Test parsing found ${actions.length} actions`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in conversation test:', error);
    return NextResponse.json({ 
      error: 'Failed to test conversation parsing',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}