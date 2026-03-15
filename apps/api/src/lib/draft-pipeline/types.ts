import { AiProviderName } from "../ai/types";
import { ProfileMaterialCategory } from "../profile-material/categories";
import { ContentThemeKey } from "./content-themes";

export type ProfileMaterialRecord = {
  id: string;
  category: ProfileMaterialCategory;
  title: string;
  content: string;
  tags: string[];
  priority: "high" | "medium" | "low";
  used_count: number;
  last_used_at: string | null;
  is_active: boolean;
};

export type AiSettingsRecord = {
  id: string;
  default_provider: string;
  default_model: string;
  custom_system_prompt: string | null;
  tone_settings: Record<string, unknown>;
  telegram_chat_id?: string;
  default_post_time: string;
  timezone: string;
};

export type DraftPipelineInput = {
  profileId?: string;
  category?: ProfileMaterialRecord["category"];
  provider?: AiProviderName;
  model?: string;
  scheduledAt?: string;
};

export type RecentDraftContext = {
  postId: string;
  createdAt: string;
  profileId: string | null;
  title: string;
  content: string;
  category: ProfileMaterialCategory | null;
  themeKey: ContentThemeKey | null;
  themeLabel: string | null;
};
