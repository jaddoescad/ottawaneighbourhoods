import { NextRequest, NextResponse } from 'next/server'

// POST - Submit feedback (sends directly to Telegram)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Feedback content is required' }, { status: 400 })
    }
    if (body.content.length > 2000) {
      return NextResponse.json({ error: 'Feedback must be under 2000 characters' }, { status: 400 })
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

    const message = `📬 *New Feedback*\n\n📍 *Page:* ${pageName}\n\n💬 ${body.content.slice(0, 500)}`

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
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
