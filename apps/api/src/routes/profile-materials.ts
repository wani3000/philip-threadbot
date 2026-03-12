import { Router } from "express";
import { asyncHandler } from "../lib/http/async-handler";
import { createSupabaseAdminClient } from "../lib/supabase";
import { requireAdminAuth } from "../middleware/auth";
import {
  profileMaterialCreateSchema,
  profileMaterialQuerySchema,
  profileMaterialUpdateSchema
} from "../lib/validation/profile-material";

const profileMaterialsRouter = Router();

profileMaterialsRouter.use(requireAdminAuth);

profileMaterialsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = profileMaterialQuerySchema.parse(request.query);
    const supabase = createSupabaseAdminClient();

    let builder = supabase
      .from("philip_profiles")
      .select("*")
      .order("updated_at", { ascending: false });

    if (query.category) {
      builder = builder.eq("category", query.category);
    }

    if (query.activeOnly) {
      builder = builder.eq("is_active", true);
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

profileMaterialsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const input = profileMaterialCreateSchema.parse(request.body);
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("philip_profiles")
      .insert({
        category: input.category,
        title: input.title,
        content: input.content,
        tags: input.tags,
        priority: input.priority,
        is_active: input.isActive
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    response.status(201).json(data);
  })
);

profileMaterialsRouter.patch(
  "/:id",
  asyncHandler(async (request, response) => {
    const input = profileMaterialUpdateSchema.parse(request.body);
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("philip_profiles")
      .update({
        category: input.category,
        title: input.title,
        content: input.content,
        tags: input.tags,
        priority: input.priority,
        is_active: input.isActive
      })
      .eq("id", request.params.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    response.json(data);
  })
);

profileMaterialsRouter.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("philip_profiles")
      .delete()
      .eq("id", request.params.id);

    if (error) {
      throw error;
    }

    response.status(204).send();
  })
);

export { profileMaterialsRouter };

