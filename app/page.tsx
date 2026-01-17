export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Relay It Backend API</h1>
      <p>This is a backend API server. Available endpoints:</p>
      <ul>
        <li><code>POST /api/analyze</code> - Analyze screenshot with AI</li>
        <li><code>POST /api/summarize</code> - Summarize session entities</li>
        <li><code>GET /api/sessions</code> - List all sessions</li>
        <li><code>GET /api/sessions/[id]</code> - Get session details</li>
        <li><code>POST /api/regenerate</code> - Regenerate session analysis</li>
      </ul>
      <p>See <a href="https://github.com/AndrewMahran7/CruzHacks/blob/main/relay-that-backend/API.md">API.md</a> for full documentation.</p>
    </div>
  );
}
