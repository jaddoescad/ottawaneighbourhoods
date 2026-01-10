import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const callback = body.callback_query

    if (!callback) {
      return NextResponse.json({ ok: true })
    }

    const [action, feedbackId] = callback.data.split(':')
    const chatId = callback.message.chat.id
    const messageId = callback.message.message_id

    if (!feedbackId || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ ok: true })
    }

    let statusEmoji: string
    let statusText: string

    if (action === 'delete') {
      // Delete feedback
      const { error } = await supabaseAdmin
        .from('feedback')
        .delete()
        .eq('id', feedbackId)

      if (error) {
        console.error('Failed to delete feedback:', error)
        await answerCallback(botToken, callback.id, '❌ Failed to delete')
        return NextResponse.json({ ok: true })
      }

      statusEmoji = '🗑'
      statusText = 'Deleted'
    } else {
      // Update feedback status
      const newStatus = action === 'approve' ? 'approved' : 'rejected'

      const { error } = await supabaseAdmin
        .from('feedback')
        .update({
          status: newStatus,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', feedbackId)

      if (error) {
        console.error('Failed to update feedback:', error)
        await answerCallback(botToken, callback.id, '❌ Failed to update')
        return NextResponse.json({ ok: true })
      }

      statusEmoji = action === 'approve' ? '✅' : '❌'
      statusText = action === 'approve' ? 'Approved' : 'Rejected'
    }

    // Update the message to show it's been handled
    const originalText = callback.message.text

    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: `${originalText}\n\n${statusEmoji} *${statusText}*`,
        parse_mode: 'Markdown',
      }),
    })

    // Answer the callback to remove loading state
    await answerCallback(botToken, callback.id, `${statusEmoji} ${statusText}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}

async function answerCallback(botToken: string, callbackId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text,
    }),
  })
}
