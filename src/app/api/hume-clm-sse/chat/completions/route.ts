import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[CLM] Received request from Hume');
  
  try {
    const body = await request.json();
    const { messages, session_id, user_id } = body;
    
    console.log('[CLM] Request body:', { 
      messageCount: messages?.length, 
      session_id, 
      user_id,
      lastMessage: messages?.[messages.length - 1]
    });

    // Get the last user message
    const lastUserMessage = messages?.filter((m: any) => m.role === 'user').pop();
    const userContent = lastUserMessage?.content || '';

    // Create a simple, fast response
    let responseText = '';
    
    if (messages.length <= 2) {
      responseText = "Hello! I'm Quest Coach, your AI career development assistant. I'm here to help you explore your professional identity through the Trinity System. What brings you here today?";
    } else if (userContent.toLowerCase().includes('trinity')) {
      responseText = "The Trinity System helps you discover three key elements: your Quest (what drives you), your Service (how you help others), and your Pledge (your commitment). Which aspect would you like to explore first?";
    } else if (userContent.toLowerCase().includes('career')) {
      responseText = "I'd be happy to help with your career journey. Are you looking to make a transition, develop new skills, or better understand your professional purpose?";
    } else {
      responseText = "That's interesting. Can you tell me more about what you're hoping to achieve in our conversation today?";
    }

    console.log('[CLM] Sending response:', responseText);

    // Create the SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        try {
          // Send the response as chunks
          const words = responseText.split(' ');
          let chunkCount = 0;
          
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            
            const sseData = {
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: 'gpt-4',
              choices: [{
                index: 0,
                delta: { content: chunk },
                finish_reason: null
              }]
            };
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
            chunkCount++;
          }
          
          console.log(`[CLM] Sent ${chunkCount} chunks`);
          
          // Send final chunk
          const finalData = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'gpt-4',
            choices: [{
              index: 0,
              delta: {},
              finish_reason: 'stop'
            }]
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalData)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          
          console.log('[CLM] Response complete');
          
        } catch (error) {
          console.error('[CLM] Stream error:', error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
    
  } catch (error) {
    console.error('[CLM] Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}