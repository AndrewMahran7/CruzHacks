'use client';

import { SessionListItem } from '@/lib/types';
import Link from 'next/link';

interface GlobalScreenshotCarouselProps {
  sessions: SessionListItem[];
}

export default function GlobalScreenshotCarousel({ sessions }: GlobalScreenshotCarouselProps) {
  // TODO: In the next phase, flatten all screenshots from all sessions
  // For now, just show session names as colored boxes

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Screenshots</h2>
      
      <div className="relative">
        {/* Horizontal scrollable container */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {sessions.length === 0 ? (
            <div className="text-gray-500 text-sm">No screenshots yet</div>
          ) : (
            sessions.map((session, idx) => (
              <Link
                key={session.id}
                href={`/app/sessions/${session.id}`}
                className="flex-shrink-0 w-48 h-32 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                style={{
                  // Vary colors slightly for visual interest
                  background: `linear-gradient(135deg, hsl(${(idx * 60) % 360}, 70%, 60%), hsl(${(idx * 60 + 40) % 360}, 70%, 50%))`,
                }}
              >
                <div className="text-center p-4">
                  <div className="text-xs opacity-75 mb-1">
                    {session.screenshotCount} screenshot{session.screenshotCount !== 1 ? 's' : ''}
                  </div>
                  <div className="font-semibold line-clamp-2">{session.name}</div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* TODO: Add left/right arrow navigation buttons in next phase */}
      </div>
    </div>
  );
}
