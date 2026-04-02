import { NextRequest, NextResponse } from 'next/server'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

// POST - Submit feedback (sends directly to Telegram)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const content = typeof body.content === 'string' ? body.content.trim() : ''

    // Validation
    if (!content) {
      return NextResponse.json({ error: 'Feedback content is required' }, { status: 400 })
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'Feedback must be under 2000 characters' }, { status: 400 })
    }
    if (email.length > 320) {
      return NextResponse.json({ error: 'Email must be under 320 characters' }, { status: 400 })
    }

    // Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured')
      return NextResponse.json({ error: 'Feedback system not configured' }, { status: 500 })
    }

    const pageName = body.neighbourhood_id === '/' ? 'Home' :
      body.neighbourhood_id?.replace('/neighbourhood/', '').replace('/', '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown'

    const message = [
      '<b>New Feedback</b>',
      '',
      `<b>Page:</b> ${escapeHtml(pageName)}`,
      email ? `<b>Email:</b> ${escapeHtml(email)}` : null,
      '',
      escapeHtml(content.slice(0, 500)),
    ]
      .filter(Boolean)
      .join('\n')

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!telegramResponse.ok) {
      console.error('Telegram API error:', await telegramResponse.text())
      return NextResponse.json({ error: 'Failed to send feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
