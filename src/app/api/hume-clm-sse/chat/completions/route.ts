import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(request: NextRequest) {
  console.log('[CLM] Received request from Hume');
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { messages, session_id, user_id } = body;
        
        console.log('[CLM] Request body:', { 
          messageCount: messages?.length, 
          session_id, 
          user_id,
          lastMessage: messages?.[messages.length - 1]
        });

        // Build system prompt - matching the working implementation
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
- Use natural pauses and transitions

User Profile:
- Name: User
- Role: Professional seeking development
- Focus: Career growth and self-discovery`;

        console.log('[CLM] Starting stream generation...');
        
        // Stream the AI response
        const result = await streamText({
          model: openai('gpt-4-turbo'),
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.7,
          maxTokens: 150, // Keep very concise for voice
        });

        let chunkCount = 0;
        
        for await (const textPart of result.textStream) {
          chunkCount++;
          
          // Format as SSE in OpenAI chat completion format - EXACT format from working implementation
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
        }

        console.log(`[CLM] Stream complete. Total chunks: ${chunkCount}`);

        // Send the final chunk - matching exact format
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
        console.error('[CLM] Stream error:', error);
        // Send error in SSE format
        const errorData = {
          error: {
            message: error instanceof Error ? error.message : 'An error occurred',
            type: 'streaming_error'
          }
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
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
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}