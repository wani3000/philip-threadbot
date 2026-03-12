export const jobTypes = [
  "generate_daily_draft",
  "send_daily_telegram",
  "publish_scheduled_post"
] as const;

export type JobType = (typeof jobTypes)[number];

export type JobExecutionResult = {
  jobType: JobType;
  runKey: string;
  status: "started" | "already_succeeded";
};

