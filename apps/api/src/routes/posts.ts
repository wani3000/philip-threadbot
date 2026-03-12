import { Router } from "express";
import { generateDraftFromProfile } from "../lib/draft-pipeline";
import { asyncHandler } from "../lib/http/async-handler";
import { createSupabaseAdminClient } from "../lib/supabase";
import {
  listPostsQuerySchema,
  regeneratePostSchema,
  updatePostSchema
} from "../lib/validation/posts";
import { requireAdminAuth } from "../middleware/auth";

const postsRouter = Router();

postsRouter.use(requireAdminAuth);

postsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = listPostsQuerySchema.parse(request.query);
    const supabase = createSupabaseAdminClient();

    let builder = supabase
      .from("posts")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(query.limit);

    if (query.status) {
      builder = builder.eq("status", query.status);
    }

    if (query.dateFrom) {
      builder = builder.gte("scheduled_at", query.dateFrom);
    }

    if (query.dateTo) {
      builder = builder.lte("scheduled_at", query.dateTo);
    }

    const { data, error } = await builder;

    if (error) {
      throw error;
    }

    response.json({
      items: data ?? []
    });
  })
);

postsRouter.patch(
  "/:id",
  asyncHandler(async (request, response) => {
    const input = updatePostSchema.parse(request.body);
    const supabase = createSupabaseAdminClient();

    const updatePayload = {
      edited_content: input.editedContent,
      scheduled_at: input.scheduledAt,
      status: input.status
    };

    const { data, error } = await supabase
      .from("posts")
      .update(updatePayload)
      .eq("id", request.params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    response.json(data);
  })
);

postsRouter.post(
  "/:id/regenerate",
  asyncHandler(async (request, response) => {
    const input = regeneratePostSchema.parse(request.body);
    const supabase = createSupabaseAdminClient();

    const { data: existingPost, error } = await supabase
      .from("posts")
      .select("id, profile_id, scheduled_at, source_snapshot")
      .eq("id", request.params.id)
      .single<{
        id: string;
        profile_id: string | null;
        scheduled_at: string | null;
        source_snapshot?: { category?: string };
      }>();

    if (error) {
      throw error;
    }

    const result = await generateDraftFromProfile({
      profileId: existingPost.profile_id ?? undefined,
      category:
        (existingPost.source_snapshot?.category as
          | "career"
          | "project"
          | "teaching"
          | "online_course"
          | "insight"
          | "vibe_coding"
          | "business"
          | undefined) ?? undefined,
      provider: input.provider,
      model: input.model,
      scheduledAt: existingPost.scheduled_at ?? undefined
    });

    response.status(201).json(result);
  })
);

export { postsRouter };

