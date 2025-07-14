// Simple Node.js script to test profile endpoints
// Run with: node test-profile-debug.js

const baseUrl = 'http://localhost:3000';

async function testEndpoint(url, data = null) {
  console.log(`\n🧪 Testing: ${url}`);
  console.log('📤 Sending:', data);
  
  try {
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const result = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📥 Response:`, result);
    
    try {
      const parsed = JSON.parse(result);
      return { success: response.ok, data: parsed };
    } catch {
      return { success: response.ok, data: result };
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Profile Debug Tests\n');
  
  // Test 1: Database connection
  await testEndpoint(`${baseUrl}/api/test-profile`, {
    testType: 'connection'
  });
  
  // Test 2: Basic profile saving
  await testEndpoint(`${baseUrl}/api/test-profile`, {
    testType: 'basic-profile',
    data: {
      headline: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      about: 'Passionate developer with 10 years experience'
    }
  });
  
  // Test 3: Work experience saving
  await testEndpoint(`${baseUrl}/api/test-profile`, {
    testType: 'work-experience',
    data: {
      position: 'Software Engineer',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      description: 'Built amazing software',
      isCurrentRole: false
    }
  });
  
  // Test 4: Check saved data
  await testEndpoint(`${baseUrl}/api/test-profile`);
  
  console.log('\n✅ Tests completed!');
}

runTests().catch(console.error);