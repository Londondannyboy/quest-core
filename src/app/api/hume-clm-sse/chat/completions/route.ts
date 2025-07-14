import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser, createConversation, addMessageToConversation } from '@/lib/db/users';

export async function POST(request: NextRequest) {
  console.log('[CLM] Received request from Hume');
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { messages, session_id, user_id } = body;
        
        console.log('[CLM] Request details:', { 
          messageCount: messages?.length, 
          session_id, 
          user_id,
          messages: JSON.stringify(messages)
        });

        // Initialize user and conversation tracking
        let dbUser = null;
        let conversation = null;
        
        // For now, we'll use a mock user until Clerk is integrated
        // Later this will come from Clerk authentication
        if (user_id || session_id) {
          try {
            // Mock user data - replace with Clerk data later
            const mockClerkId = user_id || `temp_${session_id}`;
            const mockEmail = `${mockClerkId}@quest-core.temp`;
            
            dbUser = await getOrCreateUser(mockClerkId, mockEmail, 'Quest User');
            
            // Create or get conversation
            if (session_id && dbUser) {
              conversation = await prisma.conversation.findUnique({
                where: { sessionId: session_id }
              });
              
              if (!conversation) {
                conversation = await createConversation(dbUser.id, session_id, 'voice');
              }
            }
          } catch (error) {
            console.error('[CLM] Database error:', error);
            // Continue without database if there's an error
          }
        }

        // Get the last user message
        const lastUserMessage = messages?.filter((m: any) => m.role === 'user').pop();
        const userContent = lastUserMessage?.content || '';
        
        console.log('[CLM] User said:', userContent);

        // Store user message in database if we have a conversation
        if (conversation && userContent) {
          try {
            await addMessageToConversation(conversation.id, 'user', userContent);
          } catch (error) {
            console.error('[CLM] Failed to store user message:', error);
          }
        }

        // Generate contextual response based on user data
        let responseText = '';
        
        if (!userContent || messages.length <= 2) {
          const userName = dbUser?.name ? `, ${dbUser.name}` : '';
          responseText = `Hello${userName}! I'm Quest Coach. I'm here to help you explore your professional identity. What brings you here today?`;
        } else if (userContent.toLowerCase().includes('hello') || userContent.toLowerCase().includes('hi')) {
          responseText = "Great to meet you! I'd love to learn more about your professional journey. What aspect of your career would you like to explore?";
        } else if (userContent.toLowerCase().includes('trinity')) {
          // Check if user has Trinity statements
          const hasTrinity = dbUser?.trinityStatements && dbUser.trinityStatements.length > 0;
          if (hasTrinity) {
            responseText = "I see you've already started working on your Trinity. Would you like to review your current statements or explore them deeper?";
          } else {
            responseText = "The Trinity System helps you discover your Quest, Service, and Pledge. Which element speaks to you most right now?";
          }
        } else if (userContent.toLowerCase().includes('skills') || userContent.toLowerCase().includes('skill')) {
          const skillCount = dbUser?.skills?.length || 0;
          if (skillCount > 0) {
            responseText = `I see you've identified ${skillCount} skills so far. Would you like to explore how to develop them further or discover new ones?`;
          } else {
            responseText = "Let's explore your skills together. What are some things you're naturally good at or enjoy doing?";
          }
        } else {
          responseText = "That's interesting. Tell me more about what you're hoping to achieve in your career journey.";
        }

        console.log('[CLM] Responding with:', responseText);

        // Send response word by word
        const words = responseText.split(' ');
        
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
        }

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
        
        // Store assistant response in database if we have a conversation
        if (conversation && responseText) {
          try {
            await addMessageToConversation(conversation.id, 'assistant', responseText);
          } catch (error) {
            console.error('[CLM] Failed to store assistant message:', error);
          }
        }
        
        console.log('[CLM] Response complete');
        
      } catch (error) {
        console.error('[CLM] Critical error:', error);
        console.error('[CLM] Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        // Try to send a basic response even on error
        try {
          const errorResponse = {
            id: `chatcmpl-${Date.now()}`,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: 'gpt-4',
            choices: [{
              index: 0,
              delta: { content: "I'm having trouble processing that. Could you try again?" },
              finish_reason: null
            }]
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`));
          
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
        } catch (innerError) {
          console.error('[CLM] Failed to send error response:', innerError);
        }
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