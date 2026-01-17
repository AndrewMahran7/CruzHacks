'use client';

import { RegenerateState, SessionDetailResponse } from '@/lib/types';

interface SessionSummaryPanelProps {
  session: SessionDetailResponse['session'];
  regenerateState: RegenerateState | null;
}

export default function SessionSummaryPanel({ session, regenerateState }: SessionSummaryPanelProps) {
  // Determine display title
  const displayTitle = regenerateState?.suggestedNotebookTitle || session.name;
  const showOriginalName = regenerateState?.suggestedNotebookTitle && 
                          regenerateState.suggestedNotebookTitle !== session.name;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Title section */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{displayTitle}</h1>
          {regenerateState?.sessionCategory && (
            <span className="flex-shrink-0 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
              {regenerateState.sessionCategory.replace('-', ' ')}
            </span>
          )}
        </div>
        
        {showOriginalName && (
          <p className="text-sm text-gray-500">Original name: {session.name}</p>
        )}
      </div>

      {/* Summary section */}
      {regenerateState ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">AI Summary</span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {regenerateState.sessionSummary}
          </p>

          {/* Entity count */}
          {regenerateState.entities.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>
                  {regenerateState.entities.length} entit{regenerateState.entities.length !== 1 ? 'ies' : 'y'} tracked
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No AI summary available yet</p>
          <p className="text-gray-500 text-sm">
            Add more screenshots to trigger AI analysis
          </p>
        </div>
      )}

      {/* Metadata footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div>
          Created {new Date(session.createdAt).toLocaleDateString()}
        </div>
        <div>
          Updated {new Date(session.updatedAt).toLocaleDateString()}
        </div>
      </div>

      {session.description && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 italic">{session.description}</p>
        </div>
      )}
    </div>
  );
}
