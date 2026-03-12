import { Router } from "express";
import { runJob } from "../lib/jobs/runner";
import { requireCronSecret } from "../middleware/cron-auth";

const cronRouter = Router();

cronRouter.use(requireCronSecret);

cronRouter.post("/generate-daily-draft", async (request, response) => {
  const result = await runJob("generate_daily_draft", {
    date: request.body?.date
  });

  response.status(202).json(result);
});

cronRouter.post("/send-daily-telegram", async (request, response) => {
  const result = await runJob("send_daily_telegram", {
    date: request.body?.date
  });

  response.status(202).json(result);
});

cronRouter.post("/publish-approved-posts", async (request, response) => {
  const result = await runJob("publish_scheduled_post", {
    date: request.body?.date
  });

  response.status(202).json(result);
});

export { cronRouter };
