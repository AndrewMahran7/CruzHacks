'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SessionDetailResponse, ScreenshotDto } from '@/lib/types';
import SessionScreenshotCarousel from '@/components/SessionScreenshotCarousel';
import SessionSummaryPanel from '@/components/SessionSummaryPanel';
import SessionSuggestionsPanel from '@/components/SessionSuggestionsPanel';
import SessionChatPanel from '@/components/SessionChatPanel';
import Link from 'next/link';

// Map backend snake_case response to frontend camelCase type
function mapSessionDetailFromBackend(backendData: any): SessionDetailResponse {
  return {
    session: {
      id: backendData.session.id,
      name: backendData.session.name,
      description: backendData.session.description,
      createdAt: backendData.session.created_at,
      updatedAt: backendData.session.updated_at,
    },
    screenshots: (backendData.screenshots || []).map((screenshot: any): ScreenshotDto => ({
      id: screenshot.id,
      sessionId: screenshot.session_id,
      imageUrl: screenshot.image_url || screenshot.imageUrl,
      rawText: screenshot.raw_text || screenshot.rawText,
      createdAt: screenshot.created_at,
    })),
    regenerateState: backendData.regenerate_state || backendData.regenerateState ? {
      sessionSummary: backendData.regenerate_state?.session_summary || backendData.regenerateState?.sessionSummary,
      sessionCategory: backendData.regenerate_state?.session_category || backendData.regenerateState?.sessionCategory,
      entities: backendData.regenerate_state?.entities || backendData.regenerateState?.entities || [],
      suggestedNotebookTitle: backendData.regenerate_state?.suggested_notebook_title || backendData.regenerateState?.suggestedNotebookTitle,
      suggestions: backendData.regenerate_state?.suggestions || backendData.regenerateState?.suggestions || [],
    } : null,
  };
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [data, setData] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionDetail() {
      try {
        // TODO: Add Authorization header with Supabase token
        const response = await fetch(`/api/sessions/${sessionId}`, {
          headers: {
            // 'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.statusText}`);
        }

        const rawData = await response.json();
        console.log('Raw session detail response:', rawData);
        
        // Map backend response to frontend type
        const mappedData = mapSessionDetailFromBackend(rawData);
        setData(mappedData);
      } catch (err) {
        console.error('Error fetching session detail:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchSessionDetail();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Link href="/app" className="text-blue-600 hover:underline inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Sessions
        </Link>

        {/* Carousel skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
          <div className="h-72 bg-gray-200"></div>
        </div>

        {/* Summary skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-8 w-2/3 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Suggestions skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 w-40 bg-gray-300 rounded mb-4"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-36 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Link href="/app" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Sessions
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Session</h3>
          <p className="text-red-600">{error || 'Session not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/app" className="text-blue-600 hover:underline inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Sessions
      </Link>

      {/* Screenshot Carousel */}
      <SessionScreenshotCarousel screenshots={data.screenshots} />

      {/* Session Summary */}
      <SessionSummaryPanel 
        session={data.session} 
        regenerateState={data.regenerateState} 
      />

      {/* Suggestions */}
      <SessionSuggestionsPanel 
        regenerateState={data.regenerateState}
        onQuestionClick={(text) => {
          setSelectedQuestion(text);
        }}
      />

      {/* Chat Panel */}
      <SessionChatPanel 
        sessionId={sessionId}
        initialQuestionFromSuggestion={selectedQuestion}
      />
    </div>
  );
}
