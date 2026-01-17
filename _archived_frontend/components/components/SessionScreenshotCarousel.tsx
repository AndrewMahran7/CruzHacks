'use client';

import { useState } from 'react';
import { ScreenshotDto } from '@/lib/types';

interface SessionScreenshotCarouselProps {
  screenshots: ScreenshotDto[];
}

export default function SessionScreenshotCarousel({ screenshots }: SessionScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (screenshots.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500">No screenshots in this session</p>
      </div>
    );
  }

  const currentScreenshot = screenshots[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header with controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}</span>
            <span className="text-gray-400">•</span>
            <span>{currentIndex + 1} of {screenshots.length}</span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <>
                <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Collapse Carousel</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                <span>Expand Carousel</span>
              </>
            )}
          </button>
        </div>

        {/* Carousel content */}
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
          {/* Expanded view: large carousel */}
          <div className="relative bg-gray-100" style={{ minHeight: '18rem' }}>
            {/* Main image */}
            <div className="flex items-center justify-center p-4" style={{ height: '18rem' }}>
              <img
                src={currentScreenshot.imageUrl}
                alt={`Screenshot ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain cursor-pointer rounded shadow-lg hover:shadow-xl transition-shadow"
                onClick={() => setIsModalOpen(true)}
              />
            </div>

            {/* Navigation arrows */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
                  aria-label="Previous screenshot"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
                  aria-label="Next screenshot"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Screenshot timestamp */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
              {new Date(currentScreenshot.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Collapsed view: thumbnail strip */}
        {!isExpanded && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50">
            {screenshots.map((screenshot, idx) => (
              <button
                key={screenshot.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsExpanded(true);
                }}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <img
                  src={screenshot.imageUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover rounded"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          {/* Close button */}
          <button
            onClick={() => setIsModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Large image */}
          <img
            src={currentScreenshot.imageUrl}
            alt={`Screenshot ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />

          {/* Navigation arrows in modal */}
          {screenshots.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg"
                aria-label="Previous screenshot"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg"
                aria-label="Next screenshot"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Modal footer with counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {screenshots.length}
          </div>
        </div>
      )}
    </>
  );
}
