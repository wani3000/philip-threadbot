import { Router } from "express";
import { logger } from "../lib/logger";
import { runJob } from "../lib/jobs/runner";
import { asyncHandler } from "../lib/http/async-handler";
import { requireCronSecret } from "../middleware/cron-auth";

const cronRouter = Router();

cronRouter.use(requireCronSecret);

function readDateInput(request: { body?: { date?: unknown }; query?: { date?: unknown } }) {
  if (typeof request.body?.date === "string") {
    return request.body.date;
  }

  if (typeof request.query?.date === "string") {
    return request.query.date;
  }

  return undefined;
}

cronRouter.route("/generate-daily-draft").get(asyncHandler(async (request, response) => {
  const result = await runJob("generate_daily_draft", {
    date: readDateInput(request)
  });

  logger.info("cron.generate_daily_draft.accepted", result);
  response.status(202).json(result);
})).post(asyncHandler(async (request, response) => {
  const result = await runJob("generate_daily_draft", {
    date: readDateInput(request)
  });

  logger.info("cron.generate_daily_draft.accepted", result);
  response.status(202).json(result);
}));

cronRouter.route("/send-daily-telegram").get(asyncHandler(async (request, response) => {
  const result = await runJob("send_daily_telegram", {
    date: readDateInput(request)
  });

  logger.info("cron.send_daily_telegram.accepted", result);
  response.status(202).json(result);
})).post(asyncHandler(async (request, response) => {
  const result = await runJob("send_daily_telegram", {
    date: readDateInput(request)
  });

  logger.info("cron.send_daily_telegram.accepted", result);
  response.status(202).json(result);
}));

cronRouter.route("/publish-approved-posts").get(asyncHandler(async (request, response) => {
  const result = await runJob("publish_scheduled_post", {
    date: readDateInput(request)
  });

  logger.info("cron.publish_scheduled_post.accepted", result);
  response.status(202).json(result);
})).post(asyncHandler(async (request, response) => {
  const result = await runJob("publish_scheduled_post", {
    date: readDateInput(request)
  });

  logger.info("cron.publish_scheduled_post.accepted", result);
  response.status(202).json(result);
}));

export { cronRouter };
