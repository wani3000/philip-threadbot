import { AppShell } from "../../../components/app-shell";
import { ErrorPanel } from "../../../components/error-panel";
import { fetchAiSettings } from "../../../lib/api";
import { updateNotificationSettingsAction } from "../../actions";

export default async function NotificationSettingsPage() {
  try {
    const settings = await fetchAiSettings();

    return (
      <AppShell
        pathname="/settings/notification"
        title="알림 설정"
        description="텔레그램 미리보기 발송 대상, 발송 시간, 2일 cadence 기준 기본 게시 시간과 타임존을 관리합니다."
      >
        <section className="card">
          <h2 className="card-title">텔레그램 알림</h2>
          <form action={updateNotificationSettingsAction} className="form-grid">
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
                <input
                  defaultValue={settings.timezone}
                  id="timezone"
                  name="timezone"
                />
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
                알림 설정 저장
              </button>
            </div>
            <p className="card-copy" style={{ marginTop: "0.75rem" }}>
              기본 게시 시간은 자동 생성과 라이브러리 복제 시 다음 유효 cadence
              슬롯을 계산할 때 사용됩니다.
            </p>
          </form>
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/settings/notification"
        title="알림 설정"
        description="알림 설정 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "알림 설정을 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
