import { z } from "zod";
import { aiProviderNames } from "../ai/types";
import { profileMaterialCategorySchema } from "./profile-material";

export const draftGenerateSchema = z.object({
  profileId: z.string().uuid().optional(),
  category: profileMaterialCategorySchema.optional(),
  provider: z.enum(aiProviderNames).optional(),
  model: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().optional()
});

export type DraftGenerateInput = z.infer<typeof draftGenerateSchema>;

