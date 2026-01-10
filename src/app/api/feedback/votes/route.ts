import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

// GET - Get all user's votes
export async function GET(request: NextRequest) {
  const voterIp = getClientIP(request)

  const { data, error } = await supabaseAdmin
    .from('feedback_votes')
    .select('feedback_id, vote_type')
    .eq('voter_ip', voterIp)

  if (error) {
    return NextResponse.json({ votes: {} })
  }

  // Convert to object { feedback_id: vote_type }
  const votes: Record<string, string> = {}
  data?.forEach(v => {
    votes[v.feedback_id] = v.vote_type
  })

  return NextResponse.json({ votes })
}
