// Standalone test script - run with: node test-apify-standalone.js
// This tests Apify outside of Next.js environment

require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function testApify() {
  console.log('=== Standalone Apify Test ===\n');
  
  // Check environment
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
  console.log('Token available:', !!token);
  console.log('Token prefix:', token ? token.substring(0, 10) + '...' : 'NO TOKEN');
  console.log('User ID:', process.env.APIFY_USER_ID || 'NOT SET');
  
  if (!token) {
    console.error('\n❌ No Apify token found in environment');
    return;
  }
  
  try {
    // Initialize client
    console.log('\nInitializing Apify client...');
    const client = new ApifyClient({ token });
    
    // Test profile
    const testUrl = 'https://www.linkedin.com/in/williamhgates/';
    console.log(`\nScraping: ${testUrl}`);
    
    // Run actor
    console.log('Starting actor run...');
    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [testUrl]
    });
    
    console.log('Run started:', {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt
    });
    
    // Get results
    console.log('\nFetching results...');
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    if (items && items.length > 0) {
      console.log('\n✅ SUCCESS! Got profile data:');
      console.log('- Name:', items[0].name || 'N/A');
      console.log('- Headline:', items[0].headline || 'N/A');
      console.log('- Location:', items[0].location || 'N/A');
      console.log('- Skills:', items[0].skills?.length || 0);
      console.log('\nFirst 5 data keys:', Object.keys(items[0]).slice(0, 5));
    } else {
      console.log('\n❌ No data returned');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Also test direct API call
async function testDirectAPI() {
  console.log('\n\n=== Direct API Test ===\n');
  
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
  
  try {
    const response = await fetch('https://api.apify.com/v2/acts/harvestapi~linkedin-profile-scraper/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileScraperMode: "Profile details no email ($4 per 1k)",
        queries: ["https://www.linkedin.com/in/williamhgates/"]
      })
    });
    
    const result = await response.json();
    console.log('API Response:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    
  } catch (error) {
    console.error('Direct API error:', error);
  }
}

// Run tests
testApify().then(() => testDirectAPI());