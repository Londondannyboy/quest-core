import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, session_id, user_id } = body;

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

    // Create the response stream
    const response = new Response(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          
          try {
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

            let isFirstChunk = true;
            
            for await (const textPart of result.textStream) {
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
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
            }

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
            
          } catch (error) {
            console.error('Streaming error:', error);
            const errorData = {
              error: {
                message: 'An error occurred during streaming',
                type: 'streaming_error'
              }
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          } finally {
            controller.close();
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );

    return response;
    
  } catch (error) {
    console.error('CLM SSE Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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