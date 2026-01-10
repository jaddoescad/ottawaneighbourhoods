"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Don't show layout for login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/feedback', label: 'Feedback', icon: '💬' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/admin" className="font-bold text-gray-900">
            OttawaHoods Admin
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg text-left"
          >
            Sign Out
          </button>
          <Link
            href="/"
            className="block mt-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-56 p-8">
        {children}
      </main>
    </div>
  )
}
