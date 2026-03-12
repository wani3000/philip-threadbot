import express from "express";
import { env } from "./config/env";
import { cronRouter } from "./routes/cron";
import {
  AuthenticatedRequest,
  requireAdminAuth
} from "./middleware/auth";
import { sendTelegramMessage } from "./lib/telegram/client";
import { renderDraftPreviewMessage } from "./lib/telegram/templates";

const app = express();
const port = env.PORT;

app.use(express.json());

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
  async (request: AuthenticatedRequest, response) => {
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
  }
);

app.use("/cron", cronRouter);

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
