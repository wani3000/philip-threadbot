import { Router } from "express";
import { generateDraftFromProfile } from "../lib/draft-pipeline";
import { asyncHandler } from "../lib/http/async-handler";
import { draftGenerateSchema } from "../lib/validation/drafts";
import { requireAdminAuth } from "../middleware/auth";

const draftsRouter = Router();

draftsRouter.use(requireAdminAuth);

draftsRouter.post(
  "/generate",
  asyncHandler(async (request, response) => {
    const input = draftGenerateSchema.parse(request.body);
    const result = await generateDraftFromProfile(input);

    response.status(201).json(result);
  })
);

export { draftsRouter };

