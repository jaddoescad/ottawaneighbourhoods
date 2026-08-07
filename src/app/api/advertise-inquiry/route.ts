import { NextRequest, NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const business = clean(body.business, 120);
    const name = clean(body.name, 120);
    const email = clean(body.email, 320);
    const website = clean(body.website, 200);
    const budget = clean(body.budget, 60);
    const message = clean(body.message, 1000);
    // Bots fill hidden fields; humans don't
    const honeypot = clean(body.company, 100);

    if (!business || !email) {
      return NextResponse.json(
        { error: "Business name and email are required" },
        { status: 400 },
      );
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (honeypot) {
      // Pretend it worked so the bot doesn't retry
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error("Telegram credentials not configured");
      return NextResponse.json(
        { error: "Advertising enquiries are not configured" },
        { status: 500 },
      );
    }

    const page = clean(body.page, 120);
    const text = [
      "<b>New advertising enquiry</b>",
      "",
      `<b>Business:</b> ${escapeHtml(business)}`,
      name ? `<b>Contact:</b> ${escapeHtml(name)}` : null,
      `<b>Email:</b> ${escapeHtml(email)}`,
      website ? `<b>Website:</b> ${escapeHtml(website)}` : null,
      budget ? `<b>Budget:</b> ${escapeHtml(budget)}` : null,
      page ? `<b>From page:</b> ${escapeHtml(page)}` : null,
      message ? `\n${escapeHtml(message)}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!telegramResponse.ok) {
      console.error("Telegram API error:", await telegramResponse.text());
      return NextResponse.json({ error: "Failed to send enquiry" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
