import { Router } from "express";
import { asyncHandler } from "../lib/http/async-handler";
import { createSupabaseAdminClient } from "../lib/supabase";
import { requireAdminAuth } from "../middleware/auth";
import { z } from "zod";

const aiSettingsRouter = Router();

const aiSettingsSchema = z.object({
  defaultProvider: z.enum(["anthropic", "openai", "gemini"]),
  defaultModel: z.string().min(1),
  customSystemPrompt: z.string().optional().nullable(),
  telegramChatId: z.string().min(1),
  telegramSendTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  defaultPostTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  timezone: z.string().min(1)
});

aiSettingsRouter.use(requireAdminAuth);

aiSettingsRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("ai_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    response.json(data);
  })
);

aiSettingsRouter.put(
  "/",
  asyncHandler(async (request, response) => {
    const input = aiSettingsSchema.parse(request.body);
    const supabase = createSupabaseAdminClient();

    const payload = {
      default_provider: input.defaultProvider,
      default_model: input.defaultModel,
      custom_system_prompt: input.customSystemPrompt ?? null,
      telegram_chat_id: input.telegramChatId,
      telegram_send_time:
        input.telegramSendTime.length === 5
          ? `${input.telegramSendTime}:00`
          : input.telegramSendTime,
      default_post_time:
        input.defaultPostTime.length === 5
          ? `${input.defaultPostTime}:00`
          : input.defaultPostTime,
      timezone: input.timezone
    };

    const { data: existing } = await supabase
      .from("ai_settings")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (existing?.id) {
      const { data, error } = await supabase
        .from("ai_settings")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      response.json(data);
      return;
    }

    const { data, error } = await supabase
      .from("ai_settings")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    response.status(201).json(data);
  })
);

export { aiSettingsRouter };

