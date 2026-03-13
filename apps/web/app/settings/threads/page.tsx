import { AppShell } from "../../../components/app-shell";
import { ErrorPanel } from "../../../components/error-panel";
import { fetchThreadsStatus } from "../../../lib/api";

function getStatusCopy(status: string) {
  switch (status) {
    case "connected":
      return "연결됨";
    case "token_missing":
      return "토큰 필요";
    case "error":
      return "확인 필요";
    default:
      return "설정 필요";
  }
}

export default async function ThreadsSettingsPage() {
  try {
    const status = await fetchThreadsStatus();

    return (
      <AppShell
        pathname="/settings/threads"
        title="Threads 연결"
        description="현재 연결된 Threads 계정과 OAuth 설정 상태를 확인하고, 필요하면 재연결을 시작합니다."
      >
        <div className="grid two">
          <section className="card">
            <div className="item-head">
              <div>
                <h2 className="card-title">연결 상태</h2>
                <p className="card-copy">
                  서버에 저장된 설정값과 실제 Threads 프로필 응답을 기준으로
                  상태를 표시합니다.
                </p>
              </div>
              <span className={`badge ${status.connectionStatus}`}>
                {getStatusCopy(status.connectionStatus)}
              </span>
            </div>

            <div className="list" style={{ marginTop: "1rem" }}>
              <div className="item">
                <div className="item-head">
                  <strong>OAuth 설정</strong>
                  <span>{status.oauthConfigured ? "완료" : "미완료"}</span>
                </div>
              </div>
              <div className="item">
                <div className="item-head">
                  <strong>액세스 토큰</strong>
                  <span>
                    {status.accessTokenConfigured ? "저장됨" : "없음"}
                  </span>
                </div>
              </div>
              <div className="item">
                <div className="item-head">
                  <strong>사용자 ID</strong>
                  <span>{status.configuredUserId ?? "미설정"}</span>
                </div>
              </div>
              <div className="item">
                <div className="item-head">
                  <strong>리디렉션 URI</strong>
                  <span>{status.redirectUri ?? "미설정"}</span>
                </div>
              </div>
            </div>

            {status.message ? (
              <div className="alert" style={{ marginTop: "1rem" }}>
                {status.message}
              </div>
            ) : null}

            <div className="actions" style={{ marginTop: "1rem" }}>
              {status.authorizeUrl ? (
                <a
                  className="button-primary"
                  href={status.authorizeUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Threads 재연결 시작
                </a>
              ) : null}
              <a
                className="button-secondary"
                href="https://philip-threadbot-api.vercel.app/integrations/threads/oauth/start"
                rel="noreferrer"
                target="_blank"
              >
                API OAuth 엔드포인트 열기
              </a>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">연결된 계정</h2>
            {status.profile ? (
              <div className="list" style={{ marginTop: "1rem" }}>
                <div className="item">
                  <div className="item-head">
                    <strong>사용자명</strong>
                    <span>@{status.profile.username}</span>
                  </div>
                </div>
                <div className="item">
                  <div className="item-head">
                    <strong>Threads 사용자 ID</strong>
                    <span>{status.profile.id}</span>
                  </div>
                </div>
                {status.profileUrl ? (
                  <div className="actions">
                    <a
                      className="button-secondary"
                      href={status.profileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      프로필 열기
                    </a>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state card" style={{ marginTop: "1rem" }}>
                <h2 className="card-title">계정 정보를 아직 읽지 못했습니다</h2>
                <p className="card-copy">
                  토큰 또는 OAuth 설정이 비어 있으면 프로필 조회가 되지
                  않습니다.
                </p>
              </div>
            )}
          </section>
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/settings/threads"
        title="Threads 연결"
        description="Threads 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "Threads 연결 상태를 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
