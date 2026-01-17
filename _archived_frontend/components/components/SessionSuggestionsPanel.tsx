'use client';

import { RegenerateState } from '@/lib/types';

interface SessionSuggestionsPanelProps {
  regenerateState: RegenerateState | null;
  onQuestionClick?: (text: string) => void;
}

export default function SessionSuggestionsPanel({ 
  regenerateState, 
  onQuestionClick 
}: SessionSuggestionsPanelProps) {
  if (!regenerateState || !regenerateState.suggestions || regenerateState.suggestions.length === 0) {
    return null;
  }

  const { suggestions } = regenerateState;

  // Group suggestions by type
  const questions = suggestions.filter(s => s.type === 'question');
  const rankings = suggestions.filter(s => s.type === 'ranking');
  const nextSteps = suggestions.filter(s => s.type === 'next-step');

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-900">AI Suggestions</h2>
      </div>

      <div className="space-y-4">
        {/* Questions */}
        {questions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Questions</h3>
            <div className="flex flex-wrap gap-2">
              {questions.map((suggestion, idx) => (
                suggestion.type === 'question' && (
                  <button
                    key={idx}
                    onClick={() => onQuestionClick?.(suggestion.text)}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm rounded-lg border border-blue-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {suggestion.text}
                  </button>
                )
              ))}
            </div>
          </div>
        )}

        {/* Rankings */}
        {rankings.length > 0 && (
          <div>
            {rankings.map((suggestion, idx) => (
              suggestion.type === 'ranking' && (
                <div key={idx} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    AI Ranking by {suggestion.basis}
                  </h3>
                  <ol className="space-y-2">
                    {suggestion.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold">
                          {itemIdx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">{item.entityTitle}</div>
                          <div className="text-gray-600 text-sm">{item.reason}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )
            ))}
          </div>
        )}

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Next Steps</h3>
            <div className="space-y-2">
              {nextSteps.map((suggestion, idx) => (
                suggestion.type === 'next-step' && (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <p className="text-sm text-gray-700">{suggestion.text}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
