import { Router } from "express";
import { fetchAuditLogs } from "../lib/audit";
import { asyncHandler } from "../lib/http/async-handler";
import { requireAdminAuth } from "../middleware/auth";

const auditLogsRouter = Router();

auditLogsRouter.use(requireAdminAuth);

auditLogsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const limit = Number(request.query.limit ?? 20);
    const items = await fetchAuditLogs(Number.isFinite(limit) ? limit : 20);

    response.json({
      items
    });
  })
);

export { auditLogsRouter };
