import { Router } from "express";
import { requireCronSecret } from "../middleware/cron-auth";

const cronRouter = Router();

cronRouter.use(requireCronSecret);

cronRouter.post("/generate-daily-draft", (_request, response) => {
  response.status(501).json({
    job: "generate_daily_draft",
    status: "not_implemented"
  });
});

cronRouter.post("/send-daily-telegram", (_request, response) => {
  response.status(501).json({
    job: "send_daily_telegram",
    status: "not_implemented"
  });
});

cronRouter.post("/publish-approved-posts", (_request, response) => {
  response.status(501).json({
    job: "publish_scheduled_post",
    status: "not_implemented"
  });
});

export { cronRouter };

