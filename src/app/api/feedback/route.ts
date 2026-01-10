import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { FeedbackSubmission } from '@/lib/types/feedback'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch approved feedback (public)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const neighbourhoodId = searchParams.get('neighbourhood_id')
  const feedbackType = searchParams.get('type') // null = all types
  const limit = parseInt(searchParams.get('limit') || '50')

  const supabase = await createClient()

  let query = supabase
    .from('feedback')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit)

  // Only filter by type if explicitly specified
  if (feedbackType === 'neighbourhood' && neighbourhoodId) {
    query = query.eq('feedback_type', 'neighbourhood').eq('neighbourhood_id', neighbourhoodId)
  } else if (feedbackType === 'general') {
    query = query.eq('feedback_type', 'general')
  }
  // If no type specified, return all approved feedback

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST - Submit new feedback (public)
export async function POST(request: NextRequest) {
  try {
    const body: FeedbackSubmission = await request.json()

    // Validation
    if (!body.author_name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Feedback content is required' }, { status: 400 })
    }
    if (body.content.length > 2000) {
      return NextResponse.json({ error: 'Feedback must be under 2000 characters' }, { status: 400 })
    }
    if (!['general', 'neighbourhood'].includes(body.feedback_type)) {
      return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        author_name: body.author_name.trim(),
        author_email: body.author_email?.trim() || null,
        content: body.content.trim(),
        feedback_type: body.feedback_type,
        neighbourhood_id: body.neighbourhood_id || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    // Send Telegram notification
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (botToken && chatId) {
      try {
        const pageName = body.neighbourhood_id === '/' ? 'Home' :
          body.neighbourhood_id?.replace('/neighbourhood/', '').replace('/', '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown'

        const message = `📬 *New Feedback*\n\n📍 *Page:* ${pageName}\n\n💬 ${body.content.slice(0, 500)}`

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[
                { text: '✓ Approve', callback_data: `approve:${data.id}` },
                { text: '✕ Reject', callback_data: `reject:${data.id}` },
                { text: '🗑 Delete', callback_data: `delete:${data.id}` },
              ]],
            },
          }),
        })
      } catch (telegramError) {
        console.error('Failed to send Telegram notification:', telegramError)
      }
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
