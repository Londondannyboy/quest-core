// Test CLM with authentication
const testAuthenticatedCLM = async () => {
  console.log('Testing CLM with authentication...\n');
  
  // Test the CLM endpoint - this should create a user if you're signed in
  const sessionId = `test-session-${Date.now()}`;
  
  try {
    const response = await fetch('https://quest-core-xi.vercel.app/api/hume-clm-sse/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        // In a real app, the auth cookie would be sent automatically
        // For testing, we'll just send a test message
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a helpful assistant' },
          { role: 'user', content: 'Hello, I just signed in!' }
        ],
        session_id: sessionId,
        user_id: 'test-from-browser'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ CLM endpoint is accessible');
      
      // Now check the database
      const dbResponse = await fetch('https://quest-core-xi.vercel.app/api/test-db');
      const dbStats = await dbResponse.json();
      console.log('Database stats:', dbStats);
      
    } else {
      console.log('❌ CLM endpoint returned error:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing CLM:', error);
  }
};

testAuthenticatedCLM();