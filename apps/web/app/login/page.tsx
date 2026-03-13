import { redirect } from "next/navigation";
import { signInAction } from "../actions";
import { GoogleSignInButton } from "../../components/google-sign-in-button";
import { getAdminSessionState } from "../../lib/admin";
import { isLocalDemoMode } from "../../lib/runtime";
import { getMissingSupabaseConfigMessage } from "../../lib/supabase/config";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSessionState();
  const isDemoMode = isLocalDemoMode();
  const isAuthConfigured = session.authConfigured;
  const loginDisabledMessage = !isAuthConfigured
    ? `${getMissingSupabaseConfigMessage()} Vercel web 프로젝트에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가한 뒤 다시 시도해 주세요.`
    : null;

  if (session.isAuthenticated && session.isAdmin) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Admin Access</span>
        <h1 className="auth-title">Philip Threadbot 로그인</h1>
        <p className="auth-copy">
          {isDemoMode
            ? "현재는 로컬 데모 모드입니다. 일반적으로 로그인 없이 검토할 수 있습니다."
            : isAuthConfigured
              ? "Supabase 관리자 계정으로 로그인하면 대시보드와 서버 액션이 같은 세션을 사용합니다."
              : "실로그인을 활성화하려면 Supabase 공개 키와 Google OAuth 설정이 먼저 필요합니다."}
        </p>

        {searchParams?.error ? (
          <div className="alert" style={{ marginTop: "1rem" }}>
            {searchParams.error}
          </div>
        ) : null}

        {isDemoMode ? (
          <div className="card" style={{ marginTop: "1rem" }}>
            <p className="card-copy">
              데모 모드에서는 홈 화면으로 바로 이동해 전체 흐름을 확인하시면
              됩니다.
            </p>
            <div className="actions" style={{ marginTop: "1rem" }}>
              <a className="button-primary" href="/">
                데모 대시보드 열기
              </a>
            </div>
          </div>
        ) : (
          <div className="form-grid" style={{ marginTop: "1rem" }}>
            <GoogleSignInButton
              disabled={!isAuthConfigured}
              disabledMessage={loginDisabledMessage ?? undefined}
            />

            <div className="card">
              <p className="card-copy">
                기본 운영 계정은 Google 로그인 기준으로 연결합니다.
                {isAuthConfigured
                  ? " 필요할 때만 아래 이메일 로그인 폼을 사용하세요."
                  : " 현재는 실인증 값이 비어 있어 버튼과 폼이 대기 상태입니다."}
              </p>
            </div>

            <form action={signInAction} className="form-grid">
              <div className="field">
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={!isAuthConfigured}
                />
              </div>
              <div className="field">
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={!isAuthConfigured}
                />
              </div>
              <div className="actions">
                <button
                  className="button-secondary"
                  type="submit"
                  disabled={!isAuthConfigured}
                >
                  이메일로 로그인
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
