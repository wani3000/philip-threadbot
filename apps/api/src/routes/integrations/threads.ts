import { Router } from "express";
import { requireAdminAuth } from "../../middleware/auth";
import {
  createTextThread,
  exchangeCodeForShortLivedToken,
  exchangeLongLivedToken,
  getThreadsAuthorizationUrl,
  publishThread
} from "../../lib/threads/client";
import { env } from "../../config/env";

const threadsRouter = Router();

threadsRouter.get("/oauth/start", (_request, response) => {
  const authorizeUrl = getThreadsAuthorizationUrl();

  response.json({
    authorizeUrl
  });
});

threadsRouter.get("/oauth/callback", async (request, response) => {
  const code = request.query.code;

  if (typeof code !== "string" || !code) {
    response.status(400).json({
      error: "Missing OAuth code."
    });
    return;
  }

  const shortLivedToken = await exchangeCodeForShortLivedToken(code);
  const longLivedToken = await exchangeLongLivedToken(
    shortLivedToken.access_token
  );

  response.json({
    shortLivedToken,
    longLivedToken
  });
});

threadsRouter.post(
  "/publish-test",
  requireAdminAuth,
  async (request, response) => {
    const accessToken = request.body?.accessToken ?? env.THREADS_ACCESS_TOKEN;
    const text =
      request.body?.text ??
      "Philip Threadbot test publish from admin endpoint.";

    if (!accessToken) {
      response.status(400).json({
        error: "Threads publish requires an access token."
      });
      return;
    }

    const container = await createTextThread({
      accessToken,
      text
    });

    const publishResult = await publishThread({
      accessToken,
      creationId: container.id
    });

    response.json({
      container,
      publishResult
    });
  }
);

export { threadsRouter };
