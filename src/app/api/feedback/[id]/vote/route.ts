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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const voterIp = getClientIP(request)

  try {
    const { vote } = await request.json()

    if (!['up', 'down'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 })
    }

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('feedback_votes')
      .select('id, vote_type')
      .eq('feedback_id', id)
      .eq('voter_ip', voterIp)
      .single()

    // Get current feedback
    const { data: feedback, error: fetchError } = await supabaseAdmin
      .from('feedback')
      .select('upvotes, downvotes')
      .eq('id', id)
      .single()

    if (fetchError || !feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    let newUpvotes = feedback.upvotes || 0
    let newDownvotes = feedback.downvotes || 0

    if (existingVote) {
      if (existingVote.vote_type === vote) {
        // Same vote - remove it (toggle off)
        await supabaseAdmin
          .from('feedback_votes')
          .delete()
          .eq('id', existingVote.id)

        if (vote === 'up') newUpvotes--
        else newDownvotes--
      } else {
        // Different vote - switch it
        await supabaseAdmin
          .from('feedback_votes')
          .update({ vote_type: vote })
          .eq('id', existingVote.id)

        if (vote === 'up') {
          newUpvotes++
          newDownvotes--
        } else {
          newDownvotes++
          newUpvotes--
        }
      }
    } else {
      // New vote
      await supabaseAdmin
        .from('feedback_votes')
        .insert({ feedback_id: id, voter_ip: voterIp, vote_type: vote })

      if (vote === 'up') newUpvotes++
      else newDownvotes++
    }

    // Update feedback counts
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .update({ upvotes: newUpvotes, downvotes: newDownvotes })
      .eq('id', id)
      .select('upvotes, downvotes')
      .single()

    if (error) {
      console.error('Vote error:', error)
      return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
    }

    // Return current user's vote status
    const { data: currentVote } = await supabaseAdmin
      .from('feedback_votes')
      .select('vote_type')
      .eq('feedback_id', id)
      .eq('voter_ip', voterIp)
      .single()

    return NextResponse.json({
      upvotes: data.upvotes,
      downvotes: data.downvotes,
      userVote: currentVote?.vote_type || null
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// GET - Check user's vote status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const voterIp = getClientIP(request)

  const { data } = await supabaseAdmin
    .from('feedback_votes')
    .select('vote_type')
    .eq('feedback_id', id)
    .eq('voter_ip', voterIp)
    .single()

  return NextResponse.json({ userVote: data?.vote_type || null })
}
