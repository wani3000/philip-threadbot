import { AppShell } from "../../../components/app-shell";
import { ErrorPanel } from "../../../components/error-panel";
import { fetchAiSettings } from "../../../lib/api";
import { updateAiGenerationSettingsAction } from "../../actions";

export default async function AiSettingsPage() {
  try {
    const settings = await fetchAiSettings();

    return (
      <AppShell
        pathname="/settings/ai"
        title="AI 설정"
        description="기본 모델과 시스템 프롬프트처럼 글 생성 품질에 직접 영향을 주는 요소를 관리합니다."
      >
        <section className="card">
          <h2 className="card-title">기본 생성 설정</h2>
          <form action={updateAiGenerationSettingsAction} className="form-grid">
            <div className="form-grid two">
              <div className="field">
                <label htmlFor="defaultProvider">기본 제공자</label>
                <select
                  defaultValue={settings.default_provider}
                  id="defaultProvider"
                  name="defaultProvider"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="defaultModel">기본 모델</label>
                <input
                  defaultValue={settings.default_model}
                  id="defaultModel"
                  name="defaultModel"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="customSystemPrompt">시스템 프롬프트</label>
              <textarea
                defaultValue={settings.custom_system_prompt ?? ""}
                id="customSystemPrompt"
                name="customSystemPrompt"
              />
            </div>
            <div className="actions">
              <button className="button-primary" type="submit">
                설정 저장
              </button>
            </div>
          </form>
          <div className="card" style={{ marginTop: "1rem" }}>
            <p className="card-copy">
              텔레그램 발송 대상, 발송 시각, 기본 게시 시각은 알림 설정 화면에서
              관리합니다.
            </p>
          </div>
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/settings/ai"
        title="AI 설정"
        description="설정 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "AI 설정을 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
