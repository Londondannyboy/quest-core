import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Test CLM request:', body);
    
    // Test the actual CLM endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/hume-clm-sse/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        session_id: 'test-session',
        user_id: 'test-user'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`CLM returned ${response.status}: ${response.statusText}`);
    }
    
    // Read the stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let chunks = [];
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }
    }
    
    return Response.json({
      status: 'success',
      clmResponse: {
        statusCode: response.status,
        contentType: response.headers.get('content-type'),
        chunks: chunks.length,
        preview: chunks.slice(0, 3).join('')
      }
    });
    
  } catch (error) {
    console.error('Test CLM error:', error);
    return Response.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}