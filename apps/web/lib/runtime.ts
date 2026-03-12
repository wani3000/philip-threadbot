export function isLocalDemoMode() {
  return process.env.NEXT_PUBLIC_LOCAL_DEMO_MODE === "true";
}
