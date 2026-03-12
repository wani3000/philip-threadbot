import { env } from "../../config/env";

type SendTelegramMessageInput = {
  text: string;
  chatId?: string;
};

export async function sendTelegramMessage({
  text,
  chatId
}: SendTelegramMessageInput) {
  if (!env.TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const resolvedChatId = chatId ?? env.TELEGRAM_CHAT_ID;

  if (!resolvedChatId) {
    throw new Error("Telegram delivery requires a chat id.");
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
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

