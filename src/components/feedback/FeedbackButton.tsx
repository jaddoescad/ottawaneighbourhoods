"use client"

import { useState } from 'react'
import FeedbackForm from './FeedbackForm'

interface FeedbackButtonProps {
  neighbourhoodId?: string
  neighbourhoodName?: string
}

export default function FeedbackButton({ neighbourhoodId, neighbourhoodName }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
        aria-label="Send feedback"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Send Feedback</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {neighbourhoodName
                      ? `About ${neighbourhoodName}`
                      : 'Help us improve OttawaHoods'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <FeedbackForm
                feedbackType={neighbourhoodId ? 'neighbourhood' : 'general'}
                neighbourhoodId={neighbourhoodId}
                neighbourhoodName={neighbourhoodName}
                onSuccess={() => {
                  setTimeout(() => setIsOpen(false), 2000)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
