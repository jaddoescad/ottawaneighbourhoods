"use client"

import { useEffect, useState, useCallback } from 'react'
import type { Feedback, FeedbackStatus } from '@/lib/types/feedback'
import { TAG_LABELS, TAG_COLORS } from '@/lib/types/feedback'
import FeedbackModal from './FeedbackModal'

interface FeedbackResponse {
  data: Feedback[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function FeedbackTable() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('pending')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }

      const res = await fetch(`/api/admin/feedback?${params.toString()}`)
      if (res.ok) {
        const data: FeedbackResponse = await res.json()
        setFeedback(data.data)
        setPagination(data.pagination)
      }
    } catch {
      console.error('Failed to fetch feedback')
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const handleStatusFilterChange = (status: FeedbackStatus | 'all') => {
    setStatusFilter(status)
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleModalClose = () => {
    setSelectedFeedback(null)
    fetchFeedback()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: FeedbackStatus) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusFilterChange(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No feedback found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tag
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedback.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.author_name}</div>
                    {item.author_email && (
                      <div className="text-sm text-gray-500">{item.author_email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {item.content}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {item.feedback_type === 'neighbourhood' ? (
                      <span className="text-blue-600">{item.neighbourhood_id}</span>
                    ) : (
                      'General'
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.moderator_tag && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[item.moderator_tag]}`}>
                        {TAG_LABELS[item.moderator_tag]}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => setSelectedFeedback(item)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedFeedback && (
        <FeedbackModal feedback={selectedFeedback} onClose={handleModalClose} />
      )}
    </div>
  )
}
