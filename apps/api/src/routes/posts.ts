import { Router } from "express";
import { recordAuditEvent } from "../lib/audit";
import { generateDraftFromProfile } from "../lib/draft-pipeline";
import { asyncHandler } from "../lib/http/async-handler";
import { createSupabaseAdminClient } from "../lib/supabase";
import { getDemoPost, listDemoPosts, updateDemoPost } from "../lib/demo-store";
import { isDemoModeEnabled } from "../lib/runtime";
import {
  listPostsQuerySchema,
  regeneratePostSchema,
  updatePostSchema
} from "../lib/validation/posts";
import { AuthenticatedRequest, requireAdminAuth } from "../middleware/auth";

const postsRouter = Router();

function getRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? "";
}

postsRouter.use(requireAdminAuth);

postsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = listPostsQuerySchema.parse(request.query);

    if (isDemoModeEnabled()) {
      response.json({
        items: listDemoPosts(query)
      });
      return;
    }

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
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const postId = getRouteParam(request.params.id);
    const input = updatePostSchema.parse(request.body);
    const updatePayload = {
      edited_content: input.editedContent,
      scheduled_at: input.scheduledAt,
      status: input.status
    };

    if (isDemoModeEnabled()) {
      const data = updateDemoPost(postId, updatePayload);
      await recordAuditEvent({
        action: "post.updated",
        entityType: "post",
        entityId: data.id,
        actorType: "admin",
        actorIdentifier: request.adminUser?.email ?? "unknown-admin",
        requestId: request.requestId,
        metadata: {
          status: data.status,
          scheduledAt: data.scheduled_at
        }
      });
      response.json(data);
      return;
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("posts")
      .update(updatePayload)
      .eq("id", postId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await recordAuditEvent({
      action: "post.updated",
      entityType: "post",
      entityId: data.id,
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: {
        status: data.status,
        scheduledAt: data.scheduled_at
      }
    });
    response.json(data);
  })
);

postsRouter.post(
  "/:id/regenerate",
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const postId = getRouteParam(request.params.id);
    const input = regeneratePostSchema.parse(request.body);
    const existingPost = isDemoModeEnabled()
      ? getDemoPost(postId)
      : await (async () => {
          const supabase = createSupabaseAdminClient();
          const { data, error } = await supabase
            .from("posts")
            .select("id, profile_id, scheduled_at, source_snapshot")
            .eq("id", postId)
            .single<{
              id: string;
              profile_id: string | null;
              scheduled_at: string | null;
              source_snapshot?: { category?: string };
            }>();

          if (error) {
            throw error;
          }

          return data;
        })();

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

    await recordAuditEvent({
      action: "post.regenerated",
      entityType: "post",
      entityId: postId,
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: {
        provider: result.provider,
        model: result.model,
        draftId: result.draft.id
      }
    });
    response.status(201).json(result);
  })
);

export { postsRouter };
