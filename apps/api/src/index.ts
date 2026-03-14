import express from "express";
import { env } from "./config/env";
import { aiSettingsRouter } from "./routes/ai-settings";
import { auditLogsRouter } from "./routes/audit-logs";
import { cronRouter } from "./routes/cron";
import { draftsRouter } from "./routes/drafts";
import { threadsRouter } from "./routes/integrations/threads";
import { postsRouter } from "./routes/posts";
import { profileMaterialsRouter } from "./routes/profile-materials";
import { AuthenticatedRequest, requireAdminAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { attachRequestContext } from "./middleware/request-context";
import { sendTelegramMessage } from "./lib/telegram/client";
import { renderDraftPreviewMessage } from "./lib/telegram/templates";
import { asyncHandler } from "./lib/http/async-handler";
import { logger } from "./lib/logger";
import { recordAuditEvent } from "./lib/audit";
import { getOperationalReadiness } from "./lib/operations/readiness";
import { isDemoModeEnabled } from "./lib/runtime";

const app = express();
const port = env.PORT;

app.use(attachRequestContext);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_request, response) => {
  response.json({
    service: "philip-threadbot-api",
    status: "ok",
    environment: env.NODE_ENV,
    mode: isDemoModeEnabled() ? "demo" : "live",
    routes: {
      health: "/health",
      adminHealth: "/admin/health",
      adminReadiness: "/admin/readiness",
      generateDraftCron: "/cron/generate-daily-draft",
      sendTelegramCron: "/cron/send-daily-telegram",
      publishCron: "/cron/publish-approved-posts",
      threadsOauthStart: "/integrations/threads/oauth/start"
    }
  });
});

app.get("/health", (_request, response) => {
  response.json({
    service: "philip-threadbot-api",
    status: "ok",
    environment: env.NODE_ENV,
    mode: isDemoModeEnabled() ? "demo" : "live"
  });
});

app.get(
  "/admin/health",
  requireAdminAuth,
  (request: AuthenticatedRequest, response) => {
    response.json({
      service: "philip-threadbot-api",
      status: "ok",
      admin: request.adminUser
    });
  }
);

app.get(
  "/admin/readiness",
  requireAdminAuth,
  asyncHandler(async (_request, response) => {
    const readiness = await getOperationalReadiness();
    response.json(readiness);
  })
);

app.post(
  "/admin/telegram/test",
  requireAdminAuth,
  asyncHandler(async (request: AuthenticatedRequest, response) => {
    const text =
      request.body?.text ??
      renderDraftPreviewMessage({
        scheduledAt: request.body?.scheduledAt,
        aiModel: request.body?.aiModel,
        materialCategory: request.body?.materialCategory,
        segments: [
          request.body?.content ??
            "텔레그램 초안 알림 경로가 정상적으로 연결되었습니다."
        ],
        dashboardUrl: request.body?.dashboardUrl
      });

    const telegramResponse = await sendTelegramMessage({
      text,
      chatId: request.body?.chatId
    });

    await recordAuditEvent({
      action: "telegram.test_sent",
      entityType: "telegram_delivery",
      actorType: "admin",
      actorIdentifier: request.adminUser?.email ?? "unknown-admin",
      requestId: request.requestId,
      metadata: {
        chatId: request.body?.chatId ?? env.TELEGRAM_CHAT_ID ?? null,
        simulated: isDemoModeEnabled()
      }
    });

    response.status(200).json({
      ok: true,
      admin: request.adminUser,
      telegramResponse
    });
  })
);

app.use("/cron", cronRouter);
app.use("/api/ai-settings", aiSettingsRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/drafts", draftsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/profile-materials", profileMaterialsRouter);
app.use("/integrations/threads", threadsRouter);
app.use(errorHandler);

app.listen(port, () => {
  logger.info("server.started", {
    port,
    mode: isDemoModeEnabled() ? "demo" : "live"
  });
});
