"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "../lib/admin";
import {
  fetchAiSettings,
  createProfileMaterial,
  deleteProfileMaterial,
  fetchPosts,
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
import {
  addDaysToDateParts,
  getTimeZoneParts,
  parseDateTimeLocalInTimeZone,
  parseTimeValue,
  toUtcFromTimeZone
} from "../lib/timezone";

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

  return raw;
}

const autoPostingCadenceDays = 2;

async function buildNextCadenceScheduledIso() {
  const settings = await fetchAiSettings();
  const posts = await fetchPosts({ limit: 200 });
  const latestCadencePost = posts
    .filter(
      (post) =>
        (post.status === "scheduled" || post.status === "published") &&
        Boolean(post.scheduled_at)
    )
    .sort((left, right) =>
      (right.scheduled_at ?? "").localeCompare(left.scheduled_at ?? "")
    )[0];
  const currentParts = getTimeZoneParts(
    latestCadencePost?.scheduled_at
      ? new Date(latestCadencePost.scheduled_at)
      : new Date(),
    settings.timezone
  );
  const targetDate = addDaysToDateParts(
    currentParts,
    latestCadencePost ? autoPostingCadenceDays : 1
  );
  const timeValue = parseTimeValue(settings.default_post_time);

  return toUtcFromTimeZone({
    year: targetDate.year,
    month: targetDate.month,
    day: targetDate.day,
    hour: timeValue.hour,
    minute: timeValue.minute,
    second: timeValue.second,
    timeZone: settings.timezone
  }).toISOString();
}

async function parseScheduledAtForSettings(value: FormDataEntryValue | null) {
  const raw = parseDateTimeLocal(value);

  if (!raw) {
    return null;
  }

  const settings = await fetchAiSettings();
  return parseDateTimeLocalInTimeZone(raw, settings.timezone);
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
  const scheduledAt = await parseScheduledAtForSettings(
    formData.get("scheduledAt")
  );

  await generateDraft({
    profileId: String(formData.get("profileId") || "") || undefined,
    category: String(formData.get("category") || "") || undefined,
    provider: String(formData.get("provider") || "") || undefined,
    model: String(formData.get("model") || "") || undefined,
    scheduledAt: scheduledAt ?? undefined
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/library");
}

export async function updatePostAction(formData: FormData) {
  const id = String(formData.get("id"));
  const scheduledAt = await parseScheduledAtForSettings(
    formData.get("scheduledAt")
  );

  await updatePost(id, {
    editedContent: String(formData.get("editedContent") || "") || undefined,
    scheduledAt,
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
  const scheduledAt = await buildNextCadenceScheduledIso();

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
