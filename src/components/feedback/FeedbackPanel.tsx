"use client"

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { Feedback } from '@/lib/types/feedback'
import { TAG_LABELS } from '@/lib/types/feedback'

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function getTagStyle(tag: string) {
  switch (tag) {
    case 'implemented': return 'bg-emerald-500 text-white'
    case 'planned': return 'bg-violet-500 text-white'
    case 'noted': return 'bg-slate-400 text-white'
    case 'wont_fix': return 'bg-slate-300 text-slate-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function getPageLabel(path: string): string {
  if (path === '/') return 'Home'
  if (path.startsWith('/neighbourhood/')) {
    const id = path.replace('/neighbourhood/', '')
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  return path.replace('/', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function FeedbackPanel() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down' | null>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  function handleVote(feedbackId: string, vote: 'up' | 'down') {
    const currentVote = userVotes[feedbackId]
    const item = feedback.find(f => f.id === feedbackId)
    if (!item) return

    // Calculate new values optimistically
    let newUpvotes = item.upvotes || 0
    let newDownvotes = item.downvotes || 0
    let newUserVote: 'up' | 'down' | null

    if (currentVote === vote) {
      // Toggle off
      newUserVote = null
      if (vote === 'up') newUpvotes--
      else newDownvotes--
    } else if (currentVote) {
      // Switch vote
      newUserVote = vote
      if (vote === 'up') {
        newUpvotes++
        newDownvotes--
      } else {
        newDownvotes++
        newUpvotes--
      }
    } else {
      // New vote
      newUserVote = vote
      if (vote === 'up') newUpvotes++
      else newDownvotes++
    }

    // Update UI immediately
    setFeedback(prev => prev.map(f =>
      f.id === feedbackId
        ? { ...f, upvotes: newUpvotes, downvotes: newDownvotes }
        : f
    ))
    setUserVotes(prev => ({ ...prev, [feedbackId]: newUserVote }))

    // Sync with server in background
    fetch(`/api/feedback/${feedbackId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    }).catch(() => {
      // Revert on error
      setFeedback(prev => prev.map(f =>
        f.id === feedbackId
          ? { ...f, upvotes: item.upvotes, downvotes: item.downvotes }
          : f
      ))
      setUserVotes(prev => ({ ...prev, [feedbackId]: currentVote }))
    })
  }

  useEffect(() => {
    if (isOpen) {
      fetchFeedback()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feedback])

  async function fetchFeedback() {
    setIsLoading(true)
    try {
      const [feedbackRes, votesRes] = await Promise.all([
        fetch('/api/feedback?limit=100'),
        fetch('/api/feedback/votes')
      ])

      if (feedbackRes.ok) {
        const data = await feedbackRes.json()
        const sorted = data.sort(
          (a: Feedback, b: Feedback) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        setFeedback(sorted)
      }

      if (votesRes.ok) {
        const { votes } = await votesRes.json()
        setUserVotes(votes)
      }
    } catch {
      console.error('Failed to fetch feedback')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      const isNeighbourhood = pathname.startsWith('/neighbourhood/')
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: 'Anonymous',
          content: message.trim(),
          feedback_type: isNeighbourhood ? 'neighbourhood' : 'general',
          neighbourhood_id: pathname,
        }),
      })
      if (res.ok) {
        setMessage('')
        setSubmitted(true)
        setTimeout(() => setSubmitted(false), 3000)
      }
    } catch {
      console.error('Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-full shadow-lg hover:bg-rose-600 transition-all hover:scale-105 active:scale-100"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span className="text-sm font-medium">Feedback</span>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-80 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col bg-slate-50 shadow-2xl">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Feedback</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              </div>
            ) : feedback.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <p className="text-sm text-slate-500">No feedback yet</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to share</p>
              </div>
            ) : (
              <>
                {feedback.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center gap-1.5 mb-1.5 text-[11px] text-slate-400">
                      {item.neighbourhood_id && (
                        <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {getPageLabel(item.neighbourhood_id)}
                        </span>
                      )}
                      {item.moderator_tag && (
                        <span className={`px-1.5 py-0.5 rounded ${getTagStyle(item.moderator_tag)}`}>
                          {TAG_LABELS[item.moderator_tag]}
                        </span>
                      )}
                      <span className="ml-auto">{formatTime(item.created_at)}</span>
                    </div>

                    {/* Message */}
                    <p className="text-sm text-slate-700">{item.content}</p>

                    {/* Reply */}
                    {item.moderator_reply && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-sm text-slate-600">
                        <span className="text-rose-500 font-medium">Reply: </span>
                        {item.moderator_reply}
                      </div>
                    )}

                    {/* Votes */}
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleVote(item.id, 'up')}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          userVotes[item.id] === 'up'
                            ? 'bg-green-100 text-green-700'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span>▲</span>
                        <span>{item.upvotes || 0}</span>
                      </button>
                      <button
                        onClick={() => handleVote(item.id, 'down')}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                          userVotes[item.id] === 'down'
                            ? 'bg-red-100 text-red-700'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span>▼</span>
                        <span>{item.downvotes || 0}</span>
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 bg-white border-t border-slate-200">
            {submitted ? (
              <div className="text-center py-2 text-sm text-emerald-600">
                Sent! Will appear after review.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share feedback or ideas..."
                  className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 placeholder:text-slate-400"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '...' : 'Send'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
