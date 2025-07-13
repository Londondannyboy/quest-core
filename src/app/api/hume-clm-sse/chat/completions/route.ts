import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

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

    // Build system prompt with context
    let systemPrompt = `You are Quest Coach, an AI-powered professional development assistant specializing in career growth and personal excellence.

Your role is to:
1. Guide users through the Trinity System (Quest, Service, Pledge) for self-discovery
2. Provide skills intelligence and market insights
3. Offer personalized career coaching based on user context
4. Be conversational, supportive, and insightful

Voice Interaction Guidelines:
- Keep responses concise and natural for voice conversation
- Ask one question at a time
- Acknowledge what the user says before responding
- Be encouraging and supportive
- Use natural pauses and transitions`;

    // TODO: Add user context from database when available
    // const userContext = await getUserContext(user_id);
    // if (userContext) {
    //   systemPrompt += `\n\nUser Context:\n${JSON.stringify(userContext)}`;
    // }

    console.log('[CLM] Creating response stream...');

    // Create the response stream
    const response = new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
            console.log('[CLM] Starting stream...');
            
            // Stream the AI response
            const result = await streamText({
              model: openai('gpt-4-turbo'),
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages
              ],
              temperature: 0.7,
              maxTokens: 500, // Keep responses concise for voice
            });

            let chunkCount = 0;
            
            for await (const textPart of result.textStream) {
              chunkCount++;
              
              // Format as SSE in OpenAI chat completion format
              const sseData = {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: 'gpt-4',
                choices: [{
                  index: 0,
                  delta: { content: textPart },
                  finish_reason: null
                }]
              };
              
              const chunk = `data: ${JSON.stringify(sseData)}\n\n`;
              controller.enqueue(encoder.encode(chunk));
              
              // Log every 10th chunk to avoid spam
              if (chunkCount % 10 === 0) {
                console.log(`[CLM] Sent ${chunkCount} chunks...`);
              }
            }

            console.log(`[CLM] Stream complete. Total chunks: ${chunkCount}`);

            // Send the final chunk
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
            
            console.log('[CLM] Sent final chunk and [DONE]');
            
          } catch (error) {
            console.error('[CLM] Streaming error:', error);
            const errorData = {
              error: {
                message: error instanceof Error ? error.message : 'An error occurred during streaming',
                type: 'streaming_error'
              }
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          } finally {
            controller.close();
            console.log('[CLM] Stream closed');
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable Nginx buffering
        },
      }
    );

    return response;
    
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