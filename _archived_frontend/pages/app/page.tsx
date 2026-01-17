'use client';

import { useEffect, useState } from 'react';
import { SessionListItem } from '@/lib/types';
import GlobalScreenshotCarousel from '@/components/GlobalScreenshotCarousel';
import SessionCardList from '@/components/SessionCardList';

// Map backend snake_case response to frontend camelCase type
function mapSessionFromBackend(backendSession: any): SessionListItem {
  return {
    id: backendSession.id,
    name: backendSession.name,
    description: backendSession.description,
    createdAt: backendSession.created_at,
    updatedAt: backendSession.updated_at,
    screenshotCount: backendSession.screenshot_count || 0,
    regenerateState: backendSession.regenerate_state ? {
      sessionSummary: backendSession.regenerate_state.session_summary || backendSession.regenerate_state.sessionSummary,
      sessionCategory: backendSession.regenerate_state.session_category || backendSession.regenerate_state.sessionCategory,
      entities: backendSession.regenerate_state.entities || [],
      suggestedNotebookTitle: backendSession.regenerate_state.suggested_notebook_title || backendSession.regenerate_state.suggestedNotebookTitle,
      suggestions: backendSession.regenerate_state.suggestions || [],
    } : null,
  };
}

export default function HomePage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        // TODO: Add Authorization header with Supabase token
        // const token = await supabase.auth.getSession().then(s => s.data.session?.access_token);
        
        const response = await fetch('/api/sessions', {
          headers: {
            // 'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch sessions: ${response.statusText}`);
        }

        const rawData = await response.json();
        console.log('Raw sessions response:', rawData);
        
        // Map backend response to frontend type
        const mappedSessions = Array.isArray(rawData) 
          ? rawData.map(mapSessionFromBackend)
          : [];
        
        setSessions(mappedSessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Sessions</h1>
          <p className="text-gray-600">Explore your captured screenshots and AI-powered insights</p>
        </div>

        {/* Loading Skeletons */}
        <div className="space-y-6">
          {/* Carousel skeleton */}
          <div className="animate-pulse">
            <div className="h-4 w-32 bg-gray-300 rounded mb-4"></div>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-48 h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>

          {/* Cards skeleton */}
          <div>
            <div className="h-5 w-24 bg-gray-300 rounded mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-5/6 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-gray-300 rounded"></div>
                    <div className="h-3 w-24 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Sessions</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Sessions</h1>
        <p className="text-gray-600">Explore your captured screenshots and AI-powered insights</p>
      </div>

      {/* Global Screenshot Carousel */}
      <GlobalScreenshotCarousel sessions={sessions} />

      {/* Session Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Sessions</h2>
        <SessionCardList sessions={sessions} />
      </div>
    </div>
  );
}
