import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, neighbourhood, interest, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Send lead notification to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const text = [
        `🏠 *New Real Estate Lead*`,
        ``,
        `*Name:* ${name}`,
        `*Email:* ${email}`,
        phone ? `*Phone:* ${phone}` : null,
        neighbourhood ? `*Neighbourhood:* ${neighbourhood}` : null,
        interest ? `*Interest:* ${interest}` : null,
        message ? `*Message:* ${message}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit lead" }, { status: 500 });
  }
}
