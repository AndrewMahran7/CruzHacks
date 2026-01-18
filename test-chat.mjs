/**
 * Test script for the /api/chat endpoint
 * 
 * Usage: node test-chat.mjs [local]
 * - Without args: tests against localhost:3000
 * - With "local": also tests against localhost:3000
 */

const useLocal = process.argv[2] === "local" || true; // Default to local
const BASE_URL = useLocal ? 'http://localhost:3000' : 'https://relay-that-backend.vercel.app';

console.log('🧪 Testing POST /api/chat');
console.log(`📍 Base URL: ${BASE_URL}\n`);

// Sample note for testing
const SAMPLE_NOTE = `# Japan Trip Planning

## Summary
Planning a 2-week trip to Japan in spring 2026. Visiting Tokyo, Kyoto, and Osaka.

## Hotels
- **Grand Hyatt Tokyo**: $350/night, 4.8★, Roppongi district
- **The Ritz-Carlton Kyoto**: $500/night, 4.9★, along Kamogawa River
- **Cross Hotel Osaka**: $180/night, 4.5★, near Dotonbori

## Restaurants
- Sukiyabashi Jiro (Tokyo) - Michelin 3★ sushi
- Kikunoi (Kyoto) - Traditional kaiseki
- Ichiran Ramen (Osaka) - Famous tonkotsu ramen

## Budget
- Total estimated: $8,000 for 2 people
- Flights: $2,000
- Hotels: $4,500
- Food & activities: $1,500
`;

const SAMPLE_CONTEXT = {
  screenshots: [
    {
      id: "screenshot-1",
      rawText: "Grand Hyatt Tokyo\n5-star luxury hotel\n$350 per night\nRoppongi Hills\nPool, Spa, Fitness Center",
      summary: "Luxury hotel in Roppongi with excellent amenities"
    },
    {
      id: "screenshot-2",
      rawText: "The Ritz-Carlton Kyoto\nStarting from ¥60,000/night\n4.9 rating\nTraditional Japanese design\nRiver views",
      summary: "Premium hotel in Kyoto with traditional aesthetics"
    }
  ],
  sessionName: "Japan Trip Planning",
  sessionCategory: "travel"
};

/**
 * Test 1: Edit command - Remove an item
 */
async function testEditRemove() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Edit Command - Remove Item');
  console.log('='.repeat(60));

  const request = {
    sessionId: "test-session-123",
    userMessage: "Remove the Cross Hotel Osaka from my list",
    currentNote: SAMPLE_NOTE,
    context: SAMPLE_CONTEXT
  };

  console.log('📤 User Message:', request.userMessage);
  console.log('⏳ Calling API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Response received!');
    console.log('\n📝 Reply:', result.reply);
    console.log('\n🔧 Note Modified:', result.noteWasModified);
    
    if (result.noteWasModified && result.updatedNote) {
      console.log('\n📄 Updated Note (first 500 chars):');
      console.log(result.updatedNote.substring(0, 500) + '...');
      
      // Validation
      const removed = !result.updatedNote.includes('Cross Hotel Osaka');
      console.log('\n✅ Validation:', removed ? 'Cross Hotel Osaka successfully removed' : '⚠️  Hotel still present');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 2: Question - Ask about content
 */
async function testQuestion() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Question - Ask about Note Content');
  console.log('='.repeat(60));

  const request = {
    sessionId: "test-session-123",
    userMessage: "What's my total budget for this trip?",
    currentNote: SAMPLE_NOTE,
    context: SAMPLE_CONTEXT
  };

  console.log('📤 User Message:', request.userMessage);
  console.log('⏳ Calling API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Response received!');
    console.log('\n💬 Reply:', result.reply);
    console.log('\n🔧 Note Modified:', result.noteWasModified);
    
    // Validation
    const mentionsBudget = result.reply.toLowerCase().includes('8000') || result.reply.toLowerCase().includes('8,000');
    console.log('\n✅ Validation:', mentionsBudget ? 'Answer mentions the budget correctly' : '⚠️  Budget not mentioned');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 3: Edit command - Add new section
 */
async function testEditAdd() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Edit Command - Add New Section');
  console.log('='.repeat(60));

  const request = {
    sessionId: "test-session-123",
    userMessage: "Add a new section called 'Transportation' with info about JR Pass",
    currentNote: SAMPLE_NOTE,
    context: SAMPLE_CONTEXT
  };

  console.log('📤 User Message:', request.userMessage);
  console.log('⏳ Calling API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Response received!');
    console.log('\n📝 Reply:', result.reply);
    console.log('\n🔧 Note Modified:', result.noteWasModified);
    
    if (result.noteWasModified && result.updatedNote) {
      console.log('\n📄 Updated Note (showing Transportation section):');
      const lines = result.updatedNote.split('\n');
      const transportIndex = lines.findIndex(l => l.includes('Transportation'));
      if (transportIndex !== -1) {
        console.log(lines.slice(transportIndex, transportIndex + 5).join('\n'));
        console.log('\n✅ Validation: Transportation section added');
      } else {
        console.log('⚠️  Transportation section not found');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 4: Question with context
 */
async function testQuestionWithContext() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Question Using Screenshot Context');
  console.log('='.repeat(60));

  const request = {
    sessionId: "test-session-123",
    userMessage: "What amenities does the Grand Hyatt Tokyo have?",
    currentNote: SAMPLE_NOTE,
    context: SAMPLE_CONTEXT
  };

  console.log('📤 User Message:', request.userMessage);
  console.log('⏳ Calling API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Response received!');
    console.log('\n💬 Reply:', result.reply);
    console.log('\n🔧 Note Modified:', result.noteWasModified);
    
    // Validation - should mention pool, spa, or fitness from context
    const mentionsAmenities = /pool|spa|fitness/i.test(result.reply);
    console.log('\n✅ Validation:', mentionsAmenities ? 'Answer uses screenshot context correctly' : '⚠️  Context not utilized');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

/**
 * Test 5: Invalid request - Missing fields
 */
async function testInvalidRequest() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Invalid Request - Missing Required Fields');
  console.log('='.repeat(60));

  const request = {
    sessionId: "test-session-123",
    // Missing userMessage and currentNote
  };

  console.log('📤 Sending invalid request (missing userMessage)');
  console.log('⏳ Calling API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    console.log('📥 Status:', response.status);
    
    if (response.status === 400) {
      const result = await response.json();
      console.log('✅ Correctly returned 400 error');
      console.log('📄 Error response:', JSON.stringify(result, null, 2));
    } else {
      console.log('⚠️  Expected 400 status, got', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run all tests
console.log('🚀 Starting Chat Endpoint Tests');
console.log('Make sure the server is running on', BASE_URL);
console.log('');

await testEditRemove();
await testQuestion();
await testEditAdd();
await testQuestionWithContext();
await testInvalidRequest();

console.log('\n' + '='.repeat(60));
console.log('✨ All tests completed!');
console.log('='.repeat(60));
