import { env } from "../config/env";

export function isDemoModeEnabled() {
  if (env.LOCAL_DEMO_MODE) {
    return true;
  }

  return (
    env.NODE_ENV !== "production" &&
    (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)
  );
}
