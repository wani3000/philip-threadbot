import { createSupabaseAdminClient } from "./supabase";
import { appendDemoAuditLog, listDemoAuditLogs } from "./demo-store";
import { logger } from "./logger";
import { isDemoModeEnabled } from "./runtime";

type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorType: "admin" | "system";
  actorIdentifier: string;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditInput) {
  const payload = {
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    actor_type: input.actorType,
    actor_identifier: input.actorIdentifier,
    request_id: input.requestId ?? null,
    metadata: input.metadata ?? {}
  };

  if (isDemoModeEnabled()) {
    appendDemoAuditLog(payload);
    return;
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("audit_logs").insert(payload);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.warn("audit.write_failed", {
      action: input.action,
      entityType: input.entityType,
      error
    });
  }
}

export async function fetchAuditLogs(limit = 20) {
  if (isDemoModeEnabled()) {
    return listDemoAuditLogs(limit);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
