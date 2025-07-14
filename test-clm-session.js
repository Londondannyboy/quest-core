// Test CLM session memory
const testSessionMemory = async () => {
  const sessionId = `test-session-${Date.now()}`;
  const userId = `test-user-${Date.now()}`;
  
  console.log('Testing CLM with session:', sessionId);
  
  // First message - should create user and greet by name
  const response1 = await fetch('http://localhost:3000/api/hume-clm-sse/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello!' }
      ],
      session_id: sessionId,
      user_id: userId
    })
  });
  
  console.log('\nFirst message response:');
  const reader1 = response1.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse1 = '';
  
  while (true) {
    const { done, value } = await reader1.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices[0].delta.content) {
            fullResponse1 += data.choices[0].delta.content;
          }
        } catch (e) {}
      }
    }
  }
  console.log('Assistant:', fullResponse1);
  
  // Second message - should remember the conversation
  console.log('\nSending second message in same session...');
  const response2 = await fetch('http://localhost:3000/api/hume-clm-sse/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello!' },
        { role: 'assistant', content: fullResponse1 },
        { role: 'user', content: 'Do you remember my name?' }
      ],
      session_id: sessionId,
      user_id: userId
    })
  });
  
  const reader2 = response2.body.getReader();
  let fullResponse2 = '';
  
  while (true) {
    const { done, value } = await reader2.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.choices[0].delta.content) {
            fullResponse2 += data.choices[0].delta.content;
          }
        } catch (e) {}
      }
    }
  }
  console.log('Assistant:', fullResponse2);
  
  // Check database
  console.log('\nChecking database stats...');
  const dbResponse = await fetch('http://localhost:3000/api/test-db');
  const dbStats = await dbResponse.json();
  console.log('Database stats:', dbStats);
};

// Make sure server is running first
console.log('Make sure your dev server is running (npm run dev)');
console.log('Starting test in 3 seconds...\n');
setTimeout(testSessionMemory, 3000);