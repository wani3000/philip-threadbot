import { Router } from "express";
import { recordAuditEvent } from "../lib/audit";
import { generateDraftFromProfile } from "../lib/draft-pipeline";
import { asyncHandler } from "../lib/http/async-handler";
import { draftGenerateSchema } from "../lib/validation/drafts";
import { AuthenticatedRequest, requireAdminAuth } from "../middleware/auth";

const draftsRouter = Router();

draftsRouter.use(requireAdminAuth);

draftsRouter.post(
  "/generate",
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const input = draftGenerateSchema.parse(request.body);
    const result = await generateDraftFromProfile(input);

    await recordAuditEvent({
      action: "draft.generated",
      entityType: "post",
      entityId: result.draft.id,
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: {
        provider: result.provider,
        model: result.model,
        profileId: result.material.id
      }
    });
    response.status(201).json(result);
  })
);

export { draftsRouter };
