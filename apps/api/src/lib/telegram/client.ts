import { env } from "../../config/env";
import { isDemoModeEnabled } from "../runtime";

type SendTelegramMessageInput = {
  text: string;
  chatId?: string;
};

export async function sendTelegramMessage({
  text,
  chatId
}: SendTelegramMessageInput) {
  const resolvedChatId = chatId ?? env.TELEGRAM_CHAT_ID;
  const canSendLiveMessage = Boolean(env.TELEGRAM_BOT_TOKEN && resolvedChatId);

  if (isDemoModeEnabled() && !canSendLiveMessage) {
    return {
      ok: true,
      result: {
        chat_id: resolvedChatId ?? "demo-chat",
        text,
        simulated: true
      }
    };
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  if (!resolvedChatId) {
    throw new Error("Telegram delivery requires a chat id.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      signal: AbortSignal.timeout(10_000),
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: resolvedChatId,
        text,
        disable_web_page_preview: true
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(`Telegram send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
