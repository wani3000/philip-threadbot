import { AppShell } from "../../../components/app-shell";
import { ErrorPanel } from "../../../components/error-panel";
import { fetchAiSettings } from "../../../lib/api";
import { updateAiSettingsAction } from "../../actions";

export default async function AiSettingsPage() {
  try {
    const settings = await fetchAiSettings();

    return (
      <AppShell
        pathname="/settings/ai"
        title="AI 설정"
        description="기본 모델, 시스템 프롬프트, 텔레그램 전달 대상과 시간을 함께 관리합니다."
      >
        <section className="card">
          <h2 className="card-title">기본 생성 설정</h2>
          <form action={updateAiSettingsAction} className="form-grid">
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
            <div className="form-grid two">
              <div className="field">
                <label htmlFor="telegramChatId">텔레그램 Chat ID</label>
                <input
                  defaultValue={settings.telegram_chat_id}
                  id="telegramChatId"
                  name="telegramChatId"
                />
              </div>
              <div className="field">
                <label htmlFor="timezone">Timezone</label>
                <input defaultValue={settings.timezone} id="timezone" name="timezone" />
              </div>
            </div>
            <div className="form-grid two">
              <div className="field">
                <label htmlFor="telegramSendTime">텔레그램 발송 시간</label>
                <input
                  defaultValue={settings.telegram_send_time.slice(0, 5)}
                  id="telegramSendTime"
                  name="telegramSendTime"
                  type="time"
                />
              </div>
              <div className="field">
                <label htmlFor="defaultPostTime">기본 게시 시간</label>
                <input
                  defaultValue={settings.default_post_time.slice(0, 5)}
                  id="defaultPostTime"
                  name="defaultPostTime"
                  type="time"
                />
              </div>
            </div>
            <div className="actions">
              <button className="button-primary" type="submit">
                설정 저장
              </button>
            </div>
          </form>
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
            error instanceof Error ? error.message : "AI 설정을 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}

