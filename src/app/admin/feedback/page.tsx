"use client"

import { useEffect, useState } from 'react'
import type { Feedback, FeedbackStatus, ModeratorTag } from '@/lib/types/feedback'
import { TAG_LABELS } from '@/lib/types/feedback'

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getPageLabel(path: string | null): string {
  if (!path) return ''
  if (path === '/') return 'Home'
  if (path.startsWith('/neighbourhood/')) {
    const id = path.replace('/neighbourhood/', '')
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  return path.replace('/', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function FeedbackItem({
  item,
  onAction,
  onDelete
}: {
  item: Feedback
  onAction: (id: string, action: 'approve' | 'reject', tag?: ModeratorTag, reply?: string) => void
  onDelete: (id: string) => void
}) {
  const [showReply, setShowReply] = useState(false)
  const [reply, setReply] = useState(item.moderator_reply || '')
  const [selectedTag, setSelectedTag] = useState<ModeratorTag>(item.moderator_tag)

  const isPending = item.status === 'pending'

  return (
    <div className={`p-4 rounded-lg border ${
      item.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
      item.status === 'approved' ? 'bg-green-50 border-green-200' :
      'bg-red-50 border-red-200'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {item.neighbourhood_id && (
          <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">
            {getPageLabel(item.neighbourhood_id)}
          </span>
        )}
        <span className="text-xs text-gray-500">{formatTime(item.created_at)}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${
          item.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
          item.status === 'approved' ? 'bg-green-200 text-green-800' :
          'bg-red-200 text-red-800'
        }`}>
          {item.status}
        </span>
        {item.moderator_tag && (
          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
            {TAG_LABELS[item.moderator_tag]}
          </span>
        )}
      </div>

      {/* Message */}
      <p className="text-gray-700 mb-3">{item.content}</p>

      {/* Existing Reply */}
      {item.moderator_reply && !showReply && (
        <div className="mb-3 pl-3 border-l-2 border-blue-400 text-sm text-gray-600">
          <span className="font-medium text-blue-600">Your reply: </span>
          {item.moderator_reply}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {isPending && (
          <>
            <button
              onClick={() => onAction(item.id, 'approve', selectedTag, reply || undefined)}
              className="px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onAction(item.id, 'reject')}
              className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              ✕ Reject
            </button>
          </>
        )}

        <button
          onClick={() => setShowReply(!showReply)}
          className="px-3 py-1.5 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          {showReply ? 'Cancel' : '💬 Reply'}
        </button>

        {/* Tag selector */}
        <select
          value={selectedTag || ''}
          onChange={(e) => setSelectedTag(e.target.value as ModeratorTag || null)}
          className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value="">No tag</option>
          <option value="implemented">Implemented</option>
          <option value="planned">Planned</option>
          <option value="noted">Noted</option>
          <option value="wont_fix">Won't Fix</option>
        </select>

        {!isPending && (
          <button
            onClick={() => onAction(item.id, 'approve', selectedTag, reply || undefined)}
            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Update
          </button>
        )}

        <button
          onClick={() => {
            if (confirm('Delete this feedback?')) {
              onDelete(item.id)
            }
          }}
          className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-red-100 hover:text-red-600 ml-auto"
        >
          🗑
        </button>
      </div>

      {/* Reply Input */}
      {showReply && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg"
          />
          <button
            onClick={() => {
              onAction(item.id, item.status === 'pending' ? 'approve' : 'approve', selectedTag, reply)
              setShowReply(false)
            }}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isPending ? 'Approve & Reply' : 'Save Reply'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('pending')

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/feedback?limit=100')
      if (res.ok) {
        const data = await res.json()
        setFeedback(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject', tag?: ModeratorTag, reply?: string) {
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          moderator_tag: tag,
          moderator_reply: reply,
        }),
      })
      if (res.ok) {
        fetchFeedback()
      }
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchFeedback()
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const filteredFeedback = feedback.filter(f =>
    filter === 'all' ? true : f.status === filter
  )

  const pendingCount = feedback.filter(f => f.status === 'pending').length

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Feedback {pendingCount > 0 && <span className="text-yellow-600">({pendingCount} pending)</span>}
        </h1>
        <button
          onClick={fetchFeedback}
          className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
              filter === status
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No feedback</div>
      ) : (
        <div className="space-y-3">
          {filteredFeedback.map((item) => (
            <FeedbackItem key={item.id} item={item} onAction={handleAction} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
