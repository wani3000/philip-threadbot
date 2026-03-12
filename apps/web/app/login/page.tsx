import { redirect } from "next/navigation";
import { signInAction } from "../actions";
import { getAdminSessionState } from "../../lib/admin";
import { isLocalDemoMode } from "../../lib/runtime";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSessionState();

  if (session.isAuthenticated && session.isAdmin) {
    redirect("/");
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">Admin Access</span>
        <h1 className="auth-title">Philip Threadbot 로그인</h1>
        <p className="auth-copy">
          {isLocalDemoMode()
            ? "현재는 로컬 데모 모드입니다. 일반적으로 로그인 없이 검토할 수 있습니다."
            : "Supabase 관리자 계정으로 로그인하면 대시보드와 서버 액션이 같은 세션을 사용합니다."}
        </p>

        {searchParams?.error ? (
          <div className="alert" style={{ marginTop: "1rem" }}>
            {searchParams.error}
          </div>
        ) : null}

        {isLocalDemoMode() ? (
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
          <form
            action={signInAction}
            className="form-grid"
            style={{ marginTop: "1rem" }}
          >
            <div className="field">
              <label htmlFor="email">이메일</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="field">
              <label htmlFor="password">비밀번호</label>
              <input id="password" name="password" type="password" required />
            </div>
            <div className="actions">
              <button className="button-primary" type="submit">
                로그인
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
