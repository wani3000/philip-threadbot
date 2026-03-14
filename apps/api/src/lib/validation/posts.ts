import { z } from "zod";

export const postStatusSchema = z.enum([
  "draft",
  "approved",
  "scheduled",
  "published",
  "failed",
  "cancelled"
]);

export const listPostsQuerySchema = z.object({
  status: postStatusSchema.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const updatePostSchema = z.object({
  editedContent: z.string().min(1).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  status: postStatusSchema.optional()
});

export const regeneratePostSchema = z.object({
  provider: z.enum(["anthropic", "openai", "gemini"]).optional(),
  model: z.string().min(1).optional()
});

export const reusePostSchema = z.object({
  scheduledAt: z.string().datetime().nullable().optional(),
  status: z.enum(["draft", "scheduled"]).default("draft")
});
