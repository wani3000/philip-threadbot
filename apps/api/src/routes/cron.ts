import { Router } from "express";
import { logger } from "../lib/logger";
import { runJob } from "../lib/jobs/runner";
import { requireCronSecret } from "../middleware/cron-auth";

const cronRouter = Router();

cronRouter.use(requireCronSecret);

cronRouter.post("/generate-daily-draft", async (request, response) => {
  const result = await runJob("generate_daily_draft", {
    date: request.body?.date
  });

  logger.info("cron.generate_daily_draft.accepted", result);
  response.status(202).json(result);
});

cronRouter.post("/send-daily-telegram", async (request, response) => {
  const result = await runJob("send_daily_telegram", {
    date: request.body?.date
  });

  logger.info("cron.send_daily_telegram.accepted", result);
  response.status(202).json(result);
});

cronRouter.post("/publish-approved-posts", async (request, response) => {
  const result = await runJob("publish_scheduled_post", {
    date: request.body?.date
  });

  logger.info("cron.publish_scheduled_post.accepted", result);
  response.status(202).json(result);
});

export { cronRouter };
