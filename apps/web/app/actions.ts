"use server";

import { revalidatePath } from "next/cache";
import {
  createProfileMaterial,
  deleteProfileMaterial,
  generateDraft,
  regeneratePost,
  updateAiSettings,
  updatePost,
  updateProfileMaterial
} from "../lib/api";

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
