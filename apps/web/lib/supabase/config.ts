const missingSupabaseConfigMessage =
  "Supabase 인증 설정이 아직 완료되지 않았습니다.";

export function getSupabaseAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  return {
    url,
    anonKey
  };
}

export function hasSupabaseAuthConfig() {
  const { url, anonKey } = getSupabaseAuthConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseConfigErrorMessage(scope = "웹 인증") {
  return `${scope}에는 SUPABASE_URL과 SUPABASE_ANON_KEY가 필요합니다.`;
}

export function getMissingSupabaseConfigMessage() {
  return missingSupabaseConfigMessage;
}
