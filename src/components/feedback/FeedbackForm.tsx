"use client"

import { useState } from 'react'
import type { FeedbackType } from '@/lib/types/feedback'

interface FeedbackFormProps {
  feedbackType: FeedbackType
  neighbourhoodId?: string
  neighbourhoodName?: string
  onSuccess?: () => void
}

export default function FeedbackForm({
  feedbackType,
  neighbourhoodId,
  neighbourhoodName,
  onSuccess,
}: FeedbackFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: name,
          author_email: email || undefined,
          content,
          feedback_type: feedbackType,
          neighbourhood_id: neighbourhoodId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit feedback')
      }

      setSubmitted(true)
      setName('')
      setEmail('')
      setContent('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-800 font-medium">Thanks for your feedback!</p>
        <p className="text-green-600 text-sm mt-1">
          Your comment will appear after moderation.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-3 text-sm text-green-700 underline hover:no-underline"
        >
          Submit another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {neighbourhoodName && (
        <p className="text-sm text-gray-600">
          Sharing feedback about <span className="font-medium">{neighbourhoodName}</span>
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Feedback <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={2000}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Share your thoughts, suggestions, or report an issue..."
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{content.length}/2000</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !name.trim() || !content.trim()}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </form>
  )
}
