import { z } from "zod";
import { profileMaterialCategories } from "../profile-material/categories";

export const profileMaterialCategorySchema = z.enum(profileMaterialCategories);

export const profileMaterialPrioritySchema = z.enum(["high", "medium", "low"]);

export const profileMaterialCreateSchema = z.object({
  category: profileMaterialCategorySchema,
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  priority: profileMaterialPrioritySchema.default("medium"),
  isActive: z.boolean().default(true)
});

export const profileMaterialUpdateSchema =
  profileMaterialCreateSchema.partial();

export const profileMaterialQuerySchema = z.object({
  category: profileMaterialCategorySchema.optional(),
  activeOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
});

export type ProfileMaterialCreateInput = z.infer<
  typeof profileMaterialCreateSchema
>;
export type ProfileMaterialUpdateInput = z.infer<
  typeof profileMaterialUpdateSchema
>;
