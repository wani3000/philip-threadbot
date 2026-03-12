import { env } from "../../config/env";
import {
  createSupabaseAdminClient,
  hasSupabaseAuthConfig
} from "../supabase";
import { createOrRestartJobRun } from "./store";
import { JobExecutionResult, JobType } from "./types";

function buildRunKey(jobType: JobType, dateInput?: string) {
  const date = dateInput ? new Date(dateInput) : new Date();

  const formattedDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: env.TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  return `${jobType}:${formattedDate}`;
}

async function markJobRunSucceeded(runKey: string) {
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "succeeded",
      finished_at: new Date().toISOString()
    })
    .eq("run_key", runKey);

  if (error) {
    throw error;
  }
}

function assertJobConfig() {
  if (!hasSupabaseAuthConfig || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Job execution requires SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
}

export async function runJob(
  jobType: JobType,
  options?: {
    date?: string;
  }
): Promise<JobExecutionResult> {
  assertJobConfig();

  const runKey = buildRunKey(jobType, options?.date);
  const runState = await createOrRestartJobRun(jobType, runKey);

  if (runState.status === "already_succeeded") {
    return {
      jobType,
      runKey,
      status: "already_succeeded"
    };
  }

  await markJobRunSucceeded(runKey);

  return {
    jobType,
    runKey,
    status: "started"
  };
}

