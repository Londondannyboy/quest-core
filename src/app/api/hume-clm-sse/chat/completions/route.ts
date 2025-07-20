import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser, createConversation, addMessageToConversation } from '@/lib/db/users';
import { aiClient, type CoachType } from '@/lib/ai-client';
import { zepClient, type CoachingContext } from '@/lib/zep-client';

/**
 * Determine appropriate coach type from user message content
 */
function determineCoachType(message: string): CoachType {
  if (!message) return 'master';
  
  const content = message.toLowerCase();
  
  // Career-focused keywords
  if (content.includes('career') || content.includes('job') || content.includes('role') || 
      content.includes('promotion') || content.includes('transition') || content.includes('industry')) {
    return 'career';
  }
  
  // Skills-focused keywords
  if (content.includes('skill') || content.includes('learn') || content.includes('training') || 
      content.includes('certification') || content.includes('technical') || content.includes('programming')) {
    return 'skills';
  }
  
  // Leadership-focused keywords
  if (content.includes('leadership') || content.includes('manage') || content.includes('team') || 
      content.includes('mentor') || content.includes('communication') || content.includes('feedback')) {
    return 'leadership';
  }
  
  // Network-focused keywords
  if (content.includes('network') || content.includes('relationship') || content.includes('connect') || 
      content.includes('referral') || content.includes('contact') || content.includes('interview')) {
    return 'network';
  }
  
  // Default to master coach for orchestration
  return 'master';
}

export async function POST(request: NextRequest) {
  console.log('[CLM] Received request from Hume');
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { messages, session_id, user_id } = body;
        
        // Get the last user message early for use in Zep context
        const lastUserMessage = messages?.filter((m: any) => m.role === 'user').pop();
        const userContent = lastUserMessage?.content || '';
        
        console.log('[CLM] Request details:', { 
          messageCount: messages?.length, 
          session_id, 
          user_id,
          userContent: userContent,
          messages: JSON.stringify(messages)
        });

        // Initialize user and conversation tracking
        let dbUser = null;
        let conversation = null;
        let zepContext: CoachingContext | null = null;
        
        // Get authenticated user from Clerk
        try {
          const { userId } = await auth();
          
          if (userId) {
            // Get user details from Clerk
            const clerk = await clerkClient();
            const clerkUser = await clerk.users.getUser(userId);
            
            // Use real Clerk user data
            const primaryEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
            const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
            
            dbUser = await getOrCreateUser(
              clerkUser.id,
              primaryEmail || `${clerkUser.id}@quest-core.temp`,
              fullName || clerkUser.username || 'Quest User'
            );
            
            console.log('[CLM] Authenticated user:', { 
              clerkId: clerkUser.id, 
              name: dbUser?.name, 
              email: dbUser?.email 
            });
            
            // Initialize user in Zep
            try {
              await zepClient.initializeUser(clerkUser.id, primaryEmail, fullName);
              
              // Create Zep session if needed
              if (session_id) {
                await zepClient.createSession(clerkUser.id, session_id, 'voice-coaching');
              }
              
              // Get coaching context from Zep
              zepContext = await zepClient.getCoachingContext(
                clerkUser.id, 
                userContent, 
                session_id
              );
              
              console.log('[CLM] Zep context retrieved:', {
                relevantFacts: zepContext.relevantFacts.length,
                hasTrinity: !!zepContext.trinity,
                conversationHistory: zepContext.conversationHistory.length
              });
              
            } catch (zepError) {
              console.error('[CLM] Zep error:', zepError);
              // Continue without Zep if there's an error
            }
            
            // Create or get conversation in PostgreSQL
            if (session_id && dbUser) {
              conversation = await prisma.conversation.findUnique({
                where: { sessionId: session_id }
              });
              
              if (!conversation) {
                conversation = await createConversation(dbUser.id, session_id, 'voice');
              }
            }
          } else {
            console.log('[CLM] No authenticated user found');
            // For unauthenticated users, continue without user-specific context
          }
        } catch (error) {
          console.error('[CLM] Authentication/Database error:', error);
          // Continue without database if there's an error
        }

        console.log('[CLM] User said:', userContent);

        // Store user message in Zep and database
        if (userContent) {
          // Store in Zep for conversational memory
          if (session_id && dbUser) {
            try {
              await zepClient.addMessage(session_id, 'user', userContent, {
                coach: 'user-input',
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error('[CLM] Failed to store user message in Zep:', error);
            }
          }
          
          // Store in PostgreSQL database
          if (conversation) {
            try {
              await addMessageToConversation(conversation.id, 'user', userContent);
            } catch (error) {
              console.error('[CLM] Failed to store user message in DB:', error);
            }
          }
        }

        // Generate AI response using OpenRouter
        let responseText = '';
        let aiResponse;
        
        // Determine coach type based on conversation content
        const coachType = determineCoachType(userContent);
        
        try {
          // Build enhanced context from user data and Zep memory
          const context = {
            userName: dbUser?.name,
            hasProfile: !!dbUser,
            hasTrinity: !!dbUser?.trinityCore || !!zepContext?.trinity,
            skillCount: dbUser?.userSkills?.length || 0,
            workExperienceCount: dbUser?.workExperiences?.length || 0,
            isFirstMessage: !userContent || messages.length <= 2,
            
            // Zep-enhanced context
            relevantMemories: zepContext?.relevantFacts || [],
            conversationHistory: zepContext?.conversationHistory.slice(-3) || [], // Last 3 exchanges
            trinity: zepContext?.trinity,
            userInsights: zepContext?.insights || [],
            hasMemoryContext: !!zepContext && zepContext.relevantFacts.length > 0
          };

          console.log('[CLM] 🚀 Using OpenRouter with coach:', coachType);
          
          // Generate response using OpenRouter
          aiResponse = await aiClient.generateResponse({
            sessionId: session_id || `session-${Date.now()}`,
            userId: dbUser?.id || 'anonymous',
            coach: coachType,
            message: userContent,
            context
          });
          
          responseText = aiResponse.content;
          
          console.log('[CLM] ✅ OpenRouter SUCCESS:', {
            coach: coachType,
            model: aiResponse.model,
            cost: `$${aiResponse.cost.toFixed(6)}`,
            tokens: aiResponse.tokensUsed,
            responseTime: `${aiResponse.responseTime}ms`,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error('[CLM] OpenRouter error:', error);
          
          // Fallback to contextual hard-coded responses
          if (!userContent || messages.length <= 2) {
            const userName = dbUser?.name ? `, ${dbUser.name}` : '';
            responseText = `Hello${userName}! I'm Quest Coach. I'm here to help you explore your professional identity. What brings you here today?`;
          } else {
            responseText = "I'm having a brief technical moment. Could you tell me more about what you'd like to explore in your career?";
          }
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
        
        // Store assistant response in Zep and database
        if (responseText) {
          // Store in Zep for conversational memory
          if (session_id && dbUser) {
            try {
              await zepClient.addMessage(session_id, 'assistant', responseText, {
                coach: coachType,
                model: aiResponse?.model || 'fallback',
                cost: aiResponse?.cost || 0,
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error('[CLM] Failed to store assistant message in Zep:', error);
            }
          }
          
          // Store in PostgreSQL database
          if (conversation) {
            try {
              await addMessageToConversation(conversation.id, 'assistant', responseText);
            } catch (error) {
              console.error('[CLM] Failed to store assistant message in DB:', error);
            }
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