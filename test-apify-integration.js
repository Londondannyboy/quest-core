// Quick test script to verify Apify integration
const testLinkedInUrl = 'https://www.linkedin.com/in/williamhgates/';

async function testApifyIntegration() {
  console.log('Testing Apify integration with URL:', testLinkedInUrl);
  
  try {
    const response = await fetch('http://localhost:3000/api/test-profile-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        linkedinUrl: testLinkedInUrl
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('\n✅ SUCCESS! Apify integration is working!');
      console.log('\nProfile Data:');
      console.log('- Name:', data.enrichedData.profile.name);
      console.log('- Headline:', data.enrichedData.profile.headline);
      console.log('- Location:', data.enrichedData.profile.location);
      console.log('- Skills:', data.enrichedData.profile.skillsCount);
      console.log('- Experience:', data.enrichedData.profile.experienceCount);
      console.log('\nTime taken:', data.totalTime + 'ms');
    } else {
      console.error('\n❌ FAILED:', data.error || 'Unknown error');
      console.error('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
  }
}

testApifyIntegration();