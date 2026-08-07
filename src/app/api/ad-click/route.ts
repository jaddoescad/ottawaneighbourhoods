import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_ADS } from "@/components/ads/adData";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Same visitor clicking the same ad repeatedly shouldn't spam Telegram.
 * Best effort only - serverless instances don't share this map.
 */
const recent = new Map<string, number>();
const DEDUPE_MS = 60_000;

function seenRecently(key: string) {
  const now = Date.now();
  for (const [k, at] of recent) {
    if (now - at > DEDUPE_MS) recent.delete(k);
  }
  const last = recent.get(key);
  recent.set(key, now);
  return last !== undefined && now - last < DEDUPE_MS;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Only known ad ids - never forward arbitrary text into Telegram
    const ad = SAMPLE_ADS.find((a) => a.id === body.adId);
    if (!ad) {
      return NextResponse.json({ error: "Unknown ad" }, { status: 400 });
    }

    const page =
      typeof body.page === "string" ? body.page.slice(0, 120) : "unknown";
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

    if (seenRecently(`${ip}:${ad.id}`)) {
      return new NextResponse(null, { status: 204 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const text = [
        "<b>Ad clicked</b>",
        "",
        `<b>Advertiser:</b> ${escapeHtml(ad.name)}`,
        `<b>Destination:</b> ${escapeHtml(ad.href)}`,
        `<b>Page:</b> ${escapeHtml(page)}`,
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
