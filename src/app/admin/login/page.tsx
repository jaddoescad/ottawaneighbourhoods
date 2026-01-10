import LoginForm from '@/components/admin/LoginForm'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">OttawaHoods Admin</h1>
          <p className="text-gray-600 mt-1">Sign in to moderate feedback</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
