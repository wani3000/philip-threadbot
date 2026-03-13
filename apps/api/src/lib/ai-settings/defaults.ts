import { env } from "../../config/env";

export function buildDefaultAiSettingsPayload() {
  return {
    default_provider: "anthropic",
    default_model: "claude-sonnet-4-6",
    custom_system_prompt: null,
    tone_settings: {},
    telegram_chat_id: env.TELEGRAM_CHAT_ID ?? "pending-telegram-chat-id",
    telegram_send_time: "07:00:00",
    default_post_time: "09:00:00",
    timezone: env.TIMEZONE
  };
}
