import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/hume-clm-sse/chat/completions',
    environment: {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      timestamp: new Date().toISOString()
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Test the CLM endpoint
    const testMessages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, this is a test.' }
    ]
    
    const response = await fetch(`${request.nextUrl.origin}/api/hume-clm-sse/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: testMessages,
        session_id: 'test-session',
        user_id: 'test-user'
      })
    })
    
    if (!response.ok) {
      throw new Error(`CLM endpoint returned ${response.status}`)
    }
    
    // Check if it's SSE
    const contentType = response.headers.get('content-type')
    const isSSE = contentType?.includes('text/event-stream')
    
    return NextResponse.json({
      status: 'success',
      clmEndpoint: {
        reachable: true,
        statusCode: response.status,
        isSSE: isSSE,
        contentType: contentType
      },
      testRequest: body
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check your Vercel logs for more details'
    }, { status: 500 })
  }
}