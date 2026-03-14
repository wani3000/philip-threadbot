"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "../lib/admin";
import {
  fetchAiSettings,
  createProfileMaterial,
  deleteProfileMaterial,
  generateDraft,
  regeneratePost,
  reusePost,
  syncThreadsInsights,
  updateAiSettings,
  updatePost,
  updateProfileMaterial
} from "../lib/api";
import { isLocalDemoMode } from "../lib/runtime";
import { getMissingSupabaseConfigMessage } from "../lib/supabase/config";
import { createServerSupabaseClient } from "../lib/supabase/server";

function parseTags(rawValue: FormDataEntryValue | null) {
  return String(rawValue ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseDateTimeLocal(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return null;
  }

  return new Date(raw).toISOString();
}

function parseTimeValue(value: string) {
  const [hour = "09", minute = "00", second = "00"] = value.split(":");
  return {
    hour: Number.parseInt(hour, 10),
    minute: Number.parseInt(minute, 10),
    second: Number.parseInt(second, 10)
  };
}

function getTimeZoneParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "longOffset"
  });

  const parts = formatter.formatToParts(date);
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number.parseInt(read("year"), 10),
    month: Number.parseInt(read("month"), 10),
    day: Number.parseInt(read("day"), 10),
    hour: Number.parseInt(read("hour"), 10),
    minute: Number.parseInt(read("minute"), 10),
    second: Number.parseInt(read("second"), 10),
    offsetLabel: read("timeZoneName")
  };
}

function getOffsetMinutes(date: Date, timeZone: string) {
  const { offsetLabel } = getTimeZoneParts(date, timeZone);
  const matched = offsetLabel.match(/GMT([+-])(\d{2}):?(\d{2})/u);

  if (!matched) {
    return 0;
  }

  const [, sign, hours, minutes] = matched;
  const absoluteMinutes =
    Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);

  return sign === "-" ? -absoluteMinutes : absoluteMinutes;
}

function toUtcFromTimeZone(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timeZone: string;
}) {
  const utcGuess = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    input.second
  );
  const offsetMinutes = getOffsetMinutes(new Date(utcGuess), input.timeZone);

  return new Date(utcGuess - offsetMinutes * 60_000);
}

function addDaysToDateParts(
  input: { year: number; month: number; day: number },
  dayOffset: number
) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day));
  date.setUTCDate(date.getUTCDate() + dayOffset);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

async function buildTomorrowScheduledIso() {
  const settings = await fetchAiSettings();
  const currentParts = getTimeZoneParts(new Date(), settings.timezone);
  const tomorrow = addDaysToDateParts(currentParts, 1);
  const timeValue = parseTimeValue(settings.default_post_time);

  return toUtcFromTimeZone({
    year: tomorrow.year,
    month: tomorrow.month,
    day: tomorrow.day,
    hour: timeValue.hour,
    minute: timeValue.minute,
    second: timeValue.second,
    timeZone: settings.timezone
  }).toISOString();
}

export async function createProfileMaterialAction(formData: FormData) {
  await createProfileMaterial({
    category: String(formData.get("category")),
    title: String(formData.get("title")),
    content: String(formData.get("content")),
    tags: parseTags(formData.get("tags")),
    priority: String(formData.get("priority")),
    isActive: formData.get("isActive") === "on"
  });

  revalidatePath("/profile");
  revalidatePath("/");
}

export async function updateProfileMaterialAction(formData: FormData) {
  const id = String(formData.get("id"));

  await updateProfileMaterial(id, {
    category: String(formData.get("category")),
    title: String(formData.get("title")),
    content: String(formData.get("content")),
    tags: parseTags(formData.get("tags")),
    priority: String(formData.get("priority")),
    isActive: formData.get("isActive") === "on"
  });

  revalidatePath("/profile");
  revalidatePath("/");
}

export async function deleteProfileMaterialAction(formData: FormData) {
  await deleteProfileMaterial(String(formData.get("id")));
  revalidatePath("/profile");
  revalidatePath("/");
}

export async function generateDraftAction(formData: FormData) {
  await generateDraft({
    profileId: String(formData.get("profileId") || "") || undefined,
    category: String(formData.get("category") || "") || undefined,
    provider: String(formData.get("provider") || "") || undefined,
    model: String(formData.get("model") || "") || undefined,
    scheduledAt: parseDateTimeLocal(formData.get("scheduledAt")) ?? undefined
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/library");
}

export async function updatePostAction(formData: FormData) {
  const id = String(formData.get("id"));

  await updatePost(id, {
    editedContent: String(formData.get("editedContent") || "") || undefined,
    scheduledAt: parseDateTimeLocal(formData.get("scheduledAt")),
    status: String(formData.get("status") || "") || undefined
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/library");
}

export async function cancelPostAction(formData: FormData) {
  await updatePost(String(formData.get("id")), {
    status: "cancelled"
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/library");
}

export async function regeneratePostAction(formData: FormData) {
  await regeneratePost(String(formData.get("id")), {
    provider: String(formData.get("provider") || "") || undefined,
    model: String(formData.get("model") || "") || undefined
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/library");
}

export async function reusePostAsDraftAction(formData: FormData) {
  await reusePost(String(formData.get("id")), {
    status: "draft"
  });

  revalidatePath("/library");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function reusePostForTomorrowAction(formData: FormData) {
  const scheduledAt = await buildTomorrowScheduledIso();

  await reusePost(String(formData.get("id")), {
    status: "scheduled",
    scheduledAt
  });

  revalidatePath("/library");
  revalidatePath("/");
  revalidatePath("/calendar");
}

export async function rescheduleCalendarPostAction(formData: FormData) {
  const id = String(formData.get("id"));
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();

  await updatePost(id, {
    scheduledAt: scheduledAt || null,
    status: "scheduled"
  });

  revalidatePath("/calendar");
  revalidatePath("/");
  revalidatePath("/library");
}

export async function syncThreadsInsightsAction() {
  await syncThreadsInsights();

  revalidatePath("/");
  revalidatePath("/settings/threads");
  revalidatePath("/library");
}

export async function updateAiSettingsAction(formData: FormData) {
  await updateAiSettings({
    defaultProvider: String(formData.get("defaultProvider")),
    defaultModel: String(formData.get("defaultModel")),
    customSystemPrompt: String(formData.get("customSystemPrompt") || ""),
    telegramChatId: String(formData.get("telegramChatId")),
    telegramSendTime: String(formData.get("telegramSendTime")),
    defaultPostTime: String(formData.get("defaultPostTime")),
    timezone: String(formData.get("timezone"))
  });

  revalidatePath("/settings/ai");
  revalidatePath("/");
}

export async function updateAiGenerationSettingsAction(formData: FormData) {
  const currentSettings = await fetchAiSettings();

  await updateAiSettings({
    defaultProvider: String(formData.get("defaultProvider")),
    defaultModel: String(formData.get("defaultModel")),
    customSystemPrompt: String(formData.get("customSystemPrompt") || ""),
    telegramChatId: currentSettings.telegram_chat_id,
    telegramSendTime: currentSettings.telegram_send_time,
    defaultPostTime: currentSettings.default_post_time,
    timezone: currentSettings.timezone
  });

  revalidatePath("/settings/ai");
  revalidatePath("/");
}

export async function updateNotificationSettingsAction(formData: FormData) {
  const currentSettings = await fetchAiSettings();

  await updateAiSettings({
    defaultProvider: currentSettings.default_provider,
    defaultModel: currentSettings.default_model,
    customSystemPrompt: currentSettings.custom_system_prompt ?? "",
    telegramChatId: String(formData.get("telegramChatId")),
    telegramSendTime: String(formData.get("telegramSendTime")),
    defaultPostTime: String(formData.get("defaultPostTime")),
    timezone: String(formData.get("timezone"))
  });

  revalidatePath("/settings/notification");
  revalidatePath("/settings/ai");
  revalidatePath("/");
}

export async function signInAction(formData: FormData) {
  if (isLocalDemoMode()) {
    redirect("/");
  }

  let supabase;

  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    redirect(
      `/login?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : getMissingSupabaseConfigMessage()
      )}`
    );
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (!isAllowedAdminEmail(data.user?.email ?? null)) {
    await supabase.auth.signOut();
    redirect(
      `/login?error=${encodeURIComponent("관리자 계정으로 로그인해 주세요.")}`
    );
  }

  redirect("/");
}

export async function signOutAction() {
  if (!isLocalDemoMode()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
