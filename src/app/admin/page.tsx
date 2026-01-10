import Link from 'next/link'
import StatsCards from '@/components/admin/StatsCards'

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <StatsCards />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/feedback?status=pending"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Review Pending Feedback</h3>
            <p className="text-sm text-gray-500 mt-1">
              Approve or reject new submissions
            </p>
          </Link>

          <Link
            href="/feedback"
            target="_blank"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <h3 className="font-medium text-gray-900">View Public Feedback Page</h3>
            <p className="text-sm text-gray-500 mt-1">
              See what visitors see on the feedback page
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
