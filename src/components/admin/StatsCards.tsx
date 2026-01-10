"use client"

import { useEffect, useState } from 'react'

interface Stats {
  pending: number
  approved: number
  rejected: number
  today: number
  total: number
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/feedback/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch {
        console.error('Failed to fetch stats')
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-12" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    { label: 'Pending', value: stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Approved', value: stats.approved, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: stats.rejected, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Today', value: stats.today, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-lg border border-gray-200 p-4`}>
          <p className="text-sm text-gray-600 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
