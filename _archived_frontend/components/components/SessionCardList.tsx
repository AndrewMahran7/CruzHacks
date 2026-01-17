'use client';

import { SessionListItem } from '@/lib/types';
import Link from 'next/link';

interface SessionCardListProps {
  sessions: SessionListItem[];
}

export default function SessionCardList({ sessions }: SessionCardListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No sessions yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Create your first session by capturing a screenshot
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sessions.map((session) => {
        // Use description if available, otherwise use first 120 chars of summary
        const summary = session.regenerateState?.sessionSummary;
        const displayDescription = session.description || 
          (summary ? summary.slice(0, 120) + (summary.length > 120 ? '...' : '') : null) || 
          'No description';

        return (
          <Link
            key={session.id}
            href={`/app/sessions/${session.id}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              {/* Header with name and category badge */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                  {session.name}
                </h3>
                {session.regenerateState?.sessionCategory && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize whitespace-nowrap">
                    {session.regenerateState.sessionCategory.replace('-', ' ')}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {displayDescription}
              </p>

              {/* Footer with metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{session.screenshotCount} screenshot{session.screenshotCount !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  {new Date(session.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
