/**
 * Test script for the /api/summarize endpoint
 * 
 * Usage: node test-summarize.mjs
 */

const BASE_URL = 'http://localhost:3000';

async function testSummarize() {
  console.log('🧪 Testing POST /api/summarize\n');

  const testRequest = {
    sessionId: 'test-session-123',
    sessionName: 'Trip to Taiwan',
    entities: [
      {
        type: 'hotel',
        title: 'Grand Hyatt Taipei',
        attributes: {
          price: '$250/night',
          rating: '4.8',
          location: 'Xinyi District',
          amenities: 'Pool, Gym, Spa'
        }
      },
      {
        type: 'hotel',
        title: 'W Taipei',
        attributes: {
          price: '$300/night',
          rating: '4.6',
          location: 'Xinyi District',
          amenities: 'Rooftop Bar, Pool'
        }
      },
      {
        type: 'restaurant',
        title: 'Din Tai Fung',
        attributes: {
          cuisine: 'Taiwanese',
          rating: '4.9',
          specialty: 'Xiaolongbao',
          location: 'Multiple locations'
        }
      },
      {
        type: 'restaurant',
        title: 'RAW',
        attributes: {
          cuisine: 'French-Taiwanese Fusion',
          rating: '4.7',
          chef: 'Andre Chiang',
          price: 'Fine dining'
        }
      },
      {
        type: 'attraction',
        title: 'Taipei 101',
        attributes: {
          type: 'Landmark',
          admission: '$20',
          hours: '9am-10pm',
          features: 'Observatory, Mall'
        }
      }
    ]
  };

  console.log('📤 Request:');
  console.log(JSON.stringify(testRequest, null, 2));
  console.log('\n⏳ Calling API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    const responseText = await response.text();
    console.log('📥 Raw Response:', responseText, '\n');

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }

    const result = JSON.parse(responseText);
    
    console.log('✅ Success!\n');
    console.log('=== CONDENSED SUMMARY ===');
    console.log(result.condensedSummary);
    console.log('\n=== KEY HIGHLIGHTS ===');
    result.keyHighlights.forEach((highlight, i) => {
      console.log(`${i + 1}. ${highlight}`);
    });
    console.log('\n=== RECOMMENDATIONS ===');
    result.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.log('\n=== MERGED ENTITIES ===');
    console.log(JSON.stringify(result.mergedEntities, null, 2));
    console.log('\n=== SUGGESTED TITLE ===');
    console.log(result.suggestedTitle);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Test with different scenarios
async function testJobSearch() {
  console.log('\n\n🧪 Testing Job Search Scenario\n');

  const testRequest = {
    sessionId: 'test-session-456',
    sessionName: 'Software Engineer Jobs',
    entities: [
      {
        type: 'job',
        title: 'Senior Frontend Engineer',
        attributes: {
          company: 'Tech Corp',
          salary: '$180K',
          location: 'Remote',
          stack: 'React, TypeScript, Next.js'
        }
      },
      {
        type: 'job',
        title: 'Full Stack Developer',
        attributes: {
          company: 'StartUp Inc',
          salary: '$120K + equity',
          location: 'Hybrid - SF',
          stack: 'React, Node.js, Python'
        }
      },
      {
        type: 'job',
        title: 'Frontend Developer',
        attributes: {
          company: 'DevShop',
          salary: '$150K',
          location: 'On-site NYC',
          stack: 'React, Vue.js, TypeScript'
        }
      }
    ]
  };

  try {
    const response = await fetch(`${BASE_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return;
    }

    const result = await response.json();
    
    console.log('✅ Job Search Summary:\n');
    console.log(result.condensedSummary);
    console.log('\nSuggested Title:', result.suggestedTitle);
    console.log('\nTop Recommendations:');
    result.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
console.log('🚀 Starting Summarize Endpoint Tests\n');
console.log('Make sure the server is running on http://localhost:3000\n');
console.log('=' .repeat(60));

await testSummarize();
await testJobSearch();

console.log('\n' + '='.repeat(60));
console.log('✨ All tests completed!');
