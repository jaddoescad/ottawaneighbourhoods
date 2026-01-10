import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch feedback statistics (admin only)
export async function GET() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get counts by status
  const [pendingResult, approvedResult, rejectedResult, todayResult] = await Promise.all([
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('feedback').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ])

  return NextResponse.json({
    pending: pendingResult.count || 0,
    approved: approvedResult.count || 0,
    rejected: rejectedResult.count || 0,
    today: todayResult.count || 0,
    total: (pendingResult.count || 0) + (approvedResult.count || 0) + (rejectedResult.count || 0),
  })
}
