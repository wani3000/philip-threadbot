import { AppShell } from "../components/app-shell";
import { formatDateTime } from "../components/date";
import { EmptyState } from "../components/empty-state";
import { ErrorPanel } from "../components/error-panel";
import { StatusBadge } from "../components/status-badge";
import { fetchAiSettings, fetchPosts, fetchProfileMaterials } from "../lib/api";
import {
  cancelPostAction,
  generateDraftAction,
  regeneratePostAction,
  updatePostAction
} from "./actions";

function getTomorrowRange() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  return {
    start: tomorrow.toISOString(),
    end: tomorrowEnd.toISOString()
  };
}

function getNextWeekRange() {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  return {
    start: now.toISOString(),
    end: end.toISOString()
  };
}

export default async function HomePage() {
  try {
    const tomorrowRange = getTomorrowRange();
    const nextWeekRange = getNextWeekRange();

    const [materials, tomorrowPosts, weekPosts, settings] = await Promise.all([
      fetchProfileMaterials(),
      fetchPosts({
        dateFrom: tomorrowRange.start,
        dateTo: tomorrowRange.end,
        limit: 5
      }),
      fetchPosts({
        dateFrom: nextWeekRange.start,
        dateTo: nextWeekRange.end,
        limit: 14
      }),
      fetchAiSettings()
    ]);

    const tomorrowPost = tomorrowPosts[0];

    return (
      <AppShell
        pathname="/"
        title="운영 개요"
        description="내일 게시 예정 초안, 이번 주 일정, 원재료 건강도를 한 화면에서 다룹니다."
      >
        <div className="grid three">
          <section className="card metric">
            <span className="eyebrow">활성 원재료</span>
            <strong>{materials.filter((item) => item.is_active).length}</strong>
            <p className="card-copy">현재 AI가 선택 가능한 원재료 수</p>
          </section>
          <section className="card metric">
            <span className="eyebrow">주간 예정 글</span>
            <strong>{weekPosts.length}</strong>
            <p className="card-copy">향후 7일 이내 게시 또는 예정 상태</p>
          </section>
          <section className="card metric">
            <span className="eyebrow">기본 모델</span>
            <strong>{settings.default_model}</strong>
            <p className="card-copy">{settings.default_provider} 기준 생성</p>
          </section>
        </div>

        <div className="grid two" style={{ marginTop: "1rem" }}>
          <section className="card">
            <div className="item-head">
              <div>
                <h2 className="card-title">내일 게시 예정</h2>
                <p className="card-copy">
                  편집, 취소, 재생성을 한 자리에서 처리합니다.
                </p>
              </div>
              {tomorrowPost ? <StatusBadge status={tomorrowPost.status} /> : null}
            </div>

            {tomorrowPost ? (
              <div className="grid" style={{ marginTop: "1rem" }}>
                <div className="item-meta">
                  <span>{formatDateTime(tomorrowPost.scheduled_at)}</span>
                  <span>{tomorrowPost.ai_provider}</span>
                  <span>{tomorrowPost.ai_model}</span>
                  <span>{tomorrowPost.source_snapshot?.category ?? "카테고리 없음"}</span>
                </div>
                <form action={updatePostAction} className="form-grid">
                  <input name="id" type="hidden" value={tomorrowPost.id} />
                  <div className="field">
                    <label htmlFor="editedContent">최종 편집본</label>
                    <textarea
                      defaultValue={
                        tomorrowPost.edited_content ?? tomorrowPost.generated_content
                      }
                      id="editedContent"
                      name="editedContent"
                    />
                  </div>
                  <div className="form-grid two">
                    <div className="field">
                      <label htmlFor="scheduledAt">게시 시간</label>
                      <input
                        defaultValue={
                          tomorrowPost.scheduled_at
                            ? new Date(tomorrowPost.scheduled_at)
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        id="scheduledAt"
                        name="scheduledAt"
                        type="datetime-local"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="status">상태</label>
                      <select defaultValue={tomorrowPost.status} id="status" name="status">
                        <option value="draft">draft</option>
                        <option value="approved">approved</option>
                        <option value="scheduled">scheduled</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="button-primary" type="submit">
                      변경 저장
                    </button>
                    <button
                      className="button-secondary"
                      formAction={regeneratePostAction}
                      type="submit"
                    >
                      새 초안 재생성
                    </button>
                    <button
                      className="button-danger"
                      formAction={cancelPostAction}
                      type="submit"
                    >
                      게시 취소
                    </button>
                  </div>
                </form>
                <div className="thread-preview">
                  {tomorrowPost.edited_content ?? tomorrowPost.generated_content}
                </div>
              </div>
            ) : (
              <EmptyState
                title="내일 예정 글이 없습니다"
                copy="아래 생성 폼으로 바로 초안을 만들 수 있습니다."
              />
            )}
          </section>

          <section className="card">
            <h2 className="card-title">새 초안 생성</h2>
            <p className="card-copy">
              기본 설정을 쓰되, 카테고리나 모델을 임시로 바꿔 빠르게 생성할 수 있습니다.
            </p>
            <form action={generateDraftAction} className="form-grid" style={{ marginTop: "1rem" }}>
              <div className="form-grid two">
                <div className="field">
                  <label htmlFor="category">카테고리 선택</label>
                  <select defaultValue="" id="category" name="category">
                    <option value="">자동 선택</option>
                    <option value="career">경력</option>
                    <option value="project">프로젝트</option>
                    <option value="teaching">강의</option>
                    <option value="online_course">온라인 강의</option>
                    <option value="insight">인사이트</option>
                    <option value="vibe_coding">바이브코딩</option>
                    <option value="business">사업 경험</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="profileId">원재료 직접 지정</label>
                  <select defaultValue="" id="profileId" name="profileId">
                    <option value="">자동 선택</option>
                    {materials.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-grid two">
                <div className="field">
                  <label htmlFor="provider">제공자</label>
                  <select defaultValue={settings.default_provider} id="provider" name="provider">
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="model">모델</label>
                  <input defaultValue={settings.default_model} id="model" name="model" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="scheduledAt">게시 예정 시각</label>
                <input id="scheduledAt" name="scheduledAt" type="datetime-local" />
              </div>
              <div className="actions">
                <button className="button-primary" type="submit">
                  초안 생성
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="grid two" style={{ marginTop: "1rem" }}>
          <section className="card">
            <h2 className="card-title">이번 주 캘린더</h2>
            {weekPosts.length === 0 ? (
              <EmptyState title="주간 일정 없음" copy="생성된 글이 쌓이면 이곳에 보입니다." />
            ) : (
              <div className="list">
                {weekPosts.map((post) => (
                  <article className="item" key={post.id}>
                    <div className="item-head">
                      <div>
                        <strong>{post.source_snapshot?.title ?? "초안"}</strong>
                        <div className="item-meta">
                          <span>{formatDateTime(post.scheduled_at)}</span>
                          <span>{post.ai_model}</span>
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h2 className="card-title">원재료 현황</h2>
            <div className="list">
              {Array.from(
                materials.reduce((accumulator, item) => {
                  const bucket = accumulator.get(item.category) ?? {
                    count: 0,
                    used: 0
                  };
                  bucket.count += 1;
                  bucket.used += item.used_count;
                  accumulator.set(item.category, bucket);
                  return accumulator;
                }, new Map<string, { count: number; used: number }>())
              ).map(([category, summary]) => (
                <div className="item" key={category}>
                  <div className="item-head">
                    <strong>{category}</strong>
                    <span>{summary.count}개</span>
                  </div>
                  <p className="card-copy">누적 사용 {summary.used}회</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/"
        title="운영 개요"
        description="대시보드 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error ? error.message : "개요 데이터를 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
