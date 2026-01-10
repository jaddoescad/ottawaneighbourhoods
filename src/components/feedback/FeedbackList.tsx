"use client"

import { useEffect, useState } from 'react'
import type { Feedback, FeedbackType } from '@/lib/types/feedback'
import FeedbackCard from './FeedbackCard'

interface FeedbackListProps {
  feedbackType: FeedbackType
  neighbourhoodId?: string
  refreshKey?: number
}

export default function FeedbackList({ feedbackType, neighbourhoodId, refreshKey }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchFeedback() {
      setIsLoading(true)
      setError('')

      try {
        const params = new URLSearchParams()
        params.set('type', feedbackType)
        if (neighbourhoodId) {
          params.set('neighbourhood_id', neighbourhoodId)
        }

        const res = await fetch(`/api/feedback?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to load feedback')

        const data = await res.json()
        setFeedback(data)
      } catch {
        setError('Failed to load feedback')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [feedbackType, neighbourhoodId, refreshKey])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">{error}</p>
    )
  }

  if (feedback.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No feedback yet. Be the first to share your thoughts!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {feedback.map((item) => (
        <FeedbackCard key={item.id} feedback={item} />
      ))}
    </div>
  )
}
