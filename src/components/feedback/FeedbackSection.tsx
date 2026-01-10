"use client"

import { useState } from 'react'
import FeedbackForm from './FeedbackForm'
import FeedbackList from './FeedbackList'

interface FeedbackSectionProps {
  neighbourhoodId: string
  neighbourhoodName: string
}

export default function FeedbackSection({ neighbourhoodId, neighbourhoodName }: FeedbackSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showForm, setShowForm] = useState(true) // Show form by default

  const handleSuccess = () => {
    setShowForm(false) // Hide form after success
    setTimeout(() => setRefreshKey((k) => k + 1), 1000)
  }

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Share Your Experience</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
          >
            + Add Feedback
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Live in {neighbourhoodName}? Share what you love (or don&apos;t) about the area.
          </p>
          <FeedbackForm
            feedbackType="neighbourhood"
            neighbourhoodId={neighbourhoodId}
            neighbourhoodName={neighbourhoodName}
            onSuccess={handleSuccess}
          />
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Community Comments</h3>
        <FeedbackList
          feedbackType="neighbourhood"
          neighbourhoodId={neighbourhoodId}
          refreshKey={refreshKey}
        />
      </div>
    </section>
  )
}
