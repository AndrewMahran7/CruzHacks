// Test script for GET /api/sessions
// Usage: node test-sessions.mjs

// TODO: Replace with a real Supabase access token from your auth flow
const FAKE_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

console.log('Testing GET /api/sessions...\n');

const res = await fetch('http://localhost:3000/api/sessions', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${FAKE_AUTH_TOKEN}`,
  },
});

console.log('Status:', res.status);
console.log('Response:');

const text = await res.text();
try {
  const json = JSON.parse(text);
  console.log(JSON.stringify(json, null, 2));
  
  if (Array.isArray(json) && json.length > 0) {
    console.log(`\n✓ Found ${json.length} session(s)`);
    json.forEach((session, i) => {
      console.log(`\nSession ${i + 1}:`);
      console.log(`  ID: ${session.id}`);
      console.log(`  Name: ${session.name}`);
      console.log(`  Screenshots: ${session.screenshotCount}`);
      console.log(`  Category: ${session.regenerateState?.sessionCategory || 'N/A'}`);
    });
  } else {
    console.log('\n✓ No sessions found (empty array)');
  }
} catch (e) {
  console.log('Raw response (not JSON):');
  console.log(text);
}
