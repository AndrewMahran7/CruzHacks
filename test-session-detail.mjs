// Test script for GET /api/sessions/[id]
// Usage: node test-session-detail.mjs

// TODO: Replace with a real Supabase access token from your auth flow
const FAKE_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// TODO: Replace with a real session ID from your database
const SESSION_ID = '123e4567-e89b-12d3-a456-426614174000';

console.log(`Testing GET /api/sessions/${SESSION_ID}...\n`);

const res = await fetch(`http://localhost:3000/api/sessions/${SESSION_ID}`, {
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
  
  if (json.session) {
    console.log('\n--- Session Details ---');
    console.log('ID:', json.session.id);
    console.log('Name:', json.session.name);
    console.log('Description:', json.session.description || 'None');
    console.log('Created:', json.session.createdAt);
    
    console.log('\n--- Screenshots ---');
    console.log(`Total: ${json.screenshots.length}`);
    json.screenshots.forEach((screenshot, i) => {
      console.log(`\n${i + 1}. Screenshot ${screenshot.id}`);
      console.log(`   Image: ${screenshot.imageUrl}`);
      console.log(`   Has OCR: ${screenshot.rawText ? 'Yes' : 'No'}`);
    });
    
    if (json.regenerateState) {
      console.log('\n--- Regenerate State ---');
      console.log('Category:', json.regenerateState.sessionCategory);
      console.log('Summary:', json.regenerateState.sessionSummary);
      console.log('Entities:', json.regenerateState.entities.length);
      console.log('Suggestions:', json.regenerateState.suggestions.length);
    } else {
      console.log('\n✗ No regenerate state found');
    }
  }
} catch (e) {
  console.log('Raw response (not JSON):');
  console.log(text);
}
