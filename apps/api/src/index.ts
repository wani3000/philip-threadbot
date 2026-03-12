import express from "express";
import { env } from "./config/env";
import { aiSettingsRouter } from "./routes/ai-settings";
import { cronRouter } from "./routes/cron";
import { draftsRouter } from "./routes/drafts";
import { threadsRouter } from "./routes/integrations/threads";
import { postsRouter } from "./routes/posts";
import { profileMaterialsRouter } from "./routes/profile-materials";
import {
  AuthenticatedRequest,
  requireAdminAuth
} from "./middleware/auth";
import { errorHandler } from "./middleware/error-handler";
import { sendTelegramMessage } from "./lib/telegram/client";
import { renderDraftPreviewMessage } from "./lib/telegram/templates";
import { asyncHandler } from "./lib/http/async-handler";

const app = express();
const port = env.PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_request, response) => {
  response.json({
    service: "philip-threadbot-api",
    status: "ok",
    environment: env.NODE_ENV
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
        content:
          request.body?.content ??
          "텔레그램 초안 알림 경로가 정상적으로 연결되었습니다.",
        dashboardUrl: request.body?.dashboardUrl
      });

    const telegramResponse = await sendTelegramMessage({
      text,
      chatId: request.body?.chatId
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
app.use("/api/drafts", draftsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/profile-materials", profileMaterialsRouter);
app.use("/integrations/threads", threadsRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
