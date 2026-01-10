import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Fetch all feedback with filters (admin only)
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const feedbackType = searchParams.get('type')
  const neighbourhoodId = searchParams.get('neighbourhood_id')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('status', status)
  }

  if (feedbackType && ['general', 'neighbourhood'].includes(feedbackType)) {
    query = query.eq('feedback_type', feedbackType)
  }

  if (neighbourhoodId) {
    query = query.eq('neighbourhood_id', neighbourhoodId)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}
