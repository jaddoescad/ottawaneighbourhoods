"use client"

import { useState } from 'react'
import type { Feedback, FeedbackStatus, ModeratorTag } from '@/lib/types/feedback'
import { TAG_LABELS } from '@/lib/types/feedback'

interface FeedbackModalProps {
  feedback: Feedback
  onClose: () => void
}

export default function FeedbackModal({ feedback, onClose }: FeedbackModalProps) {
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status)
  const [tag, setTag] = useState<ModeratorTag>(feedback.moderator_tag)
  const [reply, setReply] = useState(feedback.moderator_reply || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          moderator_tag: tag,
          moderator_reply: reply || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feedback?')) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/feedback/${feedback.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Failed to delete')
      }

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Review Feedback</h2>
                <p className="text-sm text-gray-500">{formatDate(feedback.created_at)}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Author Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{feedback.author_name}</p>
              {feedback.author_email && (
                <p className="text-sm text-gray-500">{feedback.author_email}</p>
              )}
              {feedback.neighbourhood_id && (
                <p className="text-sm text-blue-600 mt-1">
                  Neighbourhood: {feedback.neighbourhood_id}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback Content
              </label>
              <div className="p-3 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-900">
                {feedback.content}
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {(['pending', 'approved', 'rejected'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === s
                        ? s === 'approved'
                          ? 'bg-green-600 text-white'
                          : s === 'rejected'
                          ? 'bg-red-600 text-white'
                          : 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tag */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTag(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tag === null
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  None
                </button>
                {(['implemented', 'planned', 'noted', 'wont_fix'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      tag === t
                        ? t === 'implemented'
                          ? 'bg-green-600 text-white'
                          : t === 'planned'
                          ? 'bg-blue-600 text-white'
                          : t === 'noted'
                          ? 'bg-gray-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {TAG_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply */}
            <div className="mb-6">
              <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-1">
                Your Reply (optional)
              </label>
              <textarea
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Add a response that will be shown publicly..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
