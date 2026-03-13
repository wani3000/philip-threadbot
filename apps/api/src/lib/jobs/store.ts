import { createSupabaseAdminClient } from "../supabase";
import {
  createOrRestartDemoJobRun,
  getDemoJobRunByKey,
  markDemoJobRunFailed
} from "../demo-store";
import { isDemoModeEnabled } from "../runtime";
import { JobType } from "./types";

type StoredJobRun = {
  id: string;
  status: "queued" | "running" | "succeeded" | "failed";
  run_key: string;
};

export async function getJobRunByKey(runKey: string) {
  if (isDemoModeEnabled()) {
    return getDemoJobRunByKey(runKey);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("job_runs")
    .select("id, status, run_key")
    .eq("run_key", runKey)
    .maybeSingle<StoredJobRun>();

  if (error) {
    throw error;
  }

  return data;
}

export async function createOrRestartJobRun(jobType: JobType, runKey: string) {
  if (isDemoModeEnabled()) {
    return createOrRestartDemoJobRun(jobType, runKey);
  }

  const supabase = createSupabaseAdminClient();

  const existingRun = await getJobRunByKey(runKey);

  if (existingRun?.status === "succeeded") {
    return {
      runKey,
      status: "already_succeeded" as const
    };
  }

  if (existingRun) {
    const { error } = await supabase
      .from("job_runs")
      .update({
        status: "running",
        started_at: new Date().toISOString(),
        finished_at: null,
        error_message: null
      })
      .eq("id", existingRun.id);

    if (error) {
      throw error;
    }

    return {
      runKey,
      status: "started" as const
    };
  }

  const { error } = await supabase.from("job_runs").insert({
    job_type: jobType,
    status: "running",
    run_key: runKey,
    started_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }

  return {
    runKey,
    status: "started" as const
  };
}

export async function markJobRunFailed(runKey: string, errorMessage: string) {
  if (isDemoModeEnabled()) {
    markDemoJobRunFailed(runKey, errorMessage);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("job_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq("run_key", runKey);

  if (error) {
    throw error;
  }
}
