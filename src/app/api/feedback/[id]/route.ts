import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackModeration } from '@/lib/types/feedback'

// PATCH - Moderate feedback (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: FeedbackModeration = await request.json()

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status) {
      if (!['pending', 'approved', 'rejected'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updates.status = body.status
      updates.moderated_at = new Date().toISOString()
    }

    if (body.moderator_tag !== undefined) {
      if (body.moderator_tag !== null && !['implemented', 'planned', 'noted', 'wont_fix'].includes(body.moderator_tag)) {
        return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
      }
      updates.moderator_tag = body.moderator_tag
    }

    if (body.moderator_reply !== undefined) {
      updates.moderator_reply = body.moderator_reply?.trim() || null
    }

    const { data, error } = await supabase
      .from('feedback')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

// DELETE - Delete feedback (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('feedback')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
