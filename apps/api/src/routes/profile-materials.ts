import { Router } from "express";
import { recordAuditEvent } from "../lib/audit";
import {
  createDemoProfileMaterial,
  deleteDemoProfileMaterial,
  listDemoProfileMaterials,
  updateDemoProfileMaterial
} from "../lib/demo-store";
import { asyncHandler } from "../lib/http/async-handler";
import { createSupabaseAdminClient } from "../lib/supabase";
import { isDemoModeEnabled } from "../lib/runtime";
import { AuthenticatedRequest, requireAdminAuth } from "../middleware/auth";
import {
  profileMaterialCreateSchema,
  profileMaterialQuerySchema,
  profileMaterialUpdateSchema
} from "../lib/validation/profile-material";

const profileMaterialsRouter = Router();

function getRouteParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? "";
}

profileMaterialsRouter.use(requireAdminAuth);

profileMaterialsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const query = profileMaterialQuerySchema.parse(request.query);

    if (isDemoModeEnabled()) {
      response.json({
        items: listDemoProfileMaterials(query)
      });
      return;
    }

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
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const input = profileMaterialCreateSchema.parse(request.body);

    if (isDemoModeEnabled()) {
      const data = createDemoProfileMaterial({
        category: input.category,
        title: input.title,
        content: input.content,
        tags: input.tags,
        priority: input.priority,
        is_active: input.isActive
      });

      await recordAuditEvent({
        action: "profile_material.created",
        entityType: "profile_material",
        entityId: data.id,
        actorType: "admin",
        actorIdentifier: request.adminUser?.email ?? "unknown-admin",
        requestId: request.requestId,
        metadata: {
          title: data.title,
          category: data.category
        }
      });

      response.status(201).json(data);
      return;
    }

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

    await recordAuditEvent({
      action: "profile_material.created",
      entityType: "profile_material",
      entityId: data.id,
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: {
        title: data.title,
        category: data.category
      }
    });
    response.status(201).json(data);
  })
);

profileMaterialsRouter.patch(
  "/:id",
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const materialId = getRouteParam(request.params.id);
    const input = profileMaterialUpdateSchema.parse(request.body);

    if (isDemoModeEnabled()) {
      const data = updateDemoProfileMaterial(materialId, {
        category: input.category,
        title: input.title,
        content: input.content,
        tags: input.tags,
        priority: input.priority,
        is_active: input.isActive
      });

      await recordAuditEvent({
        action: "profile_material.updated",
        entityType: "profile_material",
        entityId: data.id,
        actorType: "admin",
        actorIdentifier: request.adminUser?.email ?? "unknown-admin",
        requestId: request.requestId,
        metadata: {
          title: data.title,
          category: data.category
        }
      });

      response.json(data);
      return;
    }

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
      .eq("id", materialId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await recordAuditEvent({
      action: "profile_material.updated",
      entityType: "profile_material",
      entityId: data.id,
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: {
        title: data.title,
        category: data.category
      }
    });
    response.json(data);
  })
);

profileMaterialsRouter.delete(
  "/:id",
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const materialId = getRouteParam(request.params.id);
    if (isDemoModeEnabled()) {
      deleteDemoProfileMaterial(materialId);
      await recordAuditEvent({
        action: "profile_material.deleted",
        entityType: "profile_material",
        entityId: materialId,
        actorType: "admin",
        actorIdentifier: request.adminUser?.email ?? "unknown-admin",
        requestId: request.requestId
      });
      response.status(204).send();
      return;
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("philip_profiles")
      .delete()
      .eq("id", materialId);

    if (error) {
      throw error;
    }

    await recordAuditEvent({
      action: "profile_material.deleted",
      entityType: "profile_material",
      entityId: materialId,
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId
    });
    response.status(204).send();
  })
);

export { profileMaterialsRouter };
