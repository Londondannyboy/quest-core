// Detailed test to see what Apify is actually returning
require('dotenv').config({ path: '.env.local' });
const { ApifyClient } = require('apify-client');

async function testApifyDetailed() {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
  const client = new ApifyClient({ token });
  
  try {
    console.log('Running detailed Apify test...\n');
    
    const testUrl = 'https://www.linkedin.com/in/williamhgates/';
    
    // Run actor
    const run = await client.actor('harvestapi/linkedin-profile-scraper').call({
      profileScraperMode: "Profile details no email ($4 per 1k)",
      queries: [testUrl]
    });
    
    console.log('Run details:', {
      id: run.id,
      status: run.status,
      exitCode: run.exitCode,
      defaultDatasetId: run.defaultDatasetId
    });
    
    // Get ALL results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`\nGot ${items.length} items\n`);
    
    // Show each item in detail
    items.forEach((item, index) => {
      console.log(`=== Item ${index + 1} ===`);
      console.log('Keys:', Object.keys(item));
      console.log('\nFull item data:');
      console.log(JSON.stringify(item, null, 2));
      console.log('\n---\n');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testApifyDetailed();