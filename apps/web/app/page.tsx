import { AppShell } from "../components/app-shell";
import { formatDateTime } from "../components/date";
import { EmptyState } from "../components/empty-state";
import { ErrorPanel } from "../components/error-panel";
import { StatusBadge } from "../components/status-badge";
import { ThreadPreview } from "../components/thread-preview";
import {
  fetchAiSettings,
  fetchAuditLogs,
  fetchOperationalReadiness,
  fetchPosts,
  fetchProfileMaterials,
  fetchThreadsInsightsSummary
} from "../lib/api";
import {
  cancelPostAction,
  generateDraftAction,
  regeneratePostAction,
  updatePostAction
} from "./actions";
import {
  getProfileCategoryLabel,
  profileCategoryOptions
} from "../lib/profile-categories";
import { hasSupabaseAuthConfig } from "../lib/supabase/config";
import { splitStoredThreadContent } from "../lib/thread-content";
import { formatDateTimeLocalInTimeZone } from "../lib/timezone";

const plannedWindowDays = 14;

function getUpcomingRange(days: number) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + days);

  return {
    start: now.toISOString(),
    end: end.toISOString()
  };
}

export default async function HomePage() {
  try {
    const upcomingRange = getUpcomingRange(plannedWindowDays);
    const webAuthReady = hasSupabaseAuthConfig();

    const [
      materials,
      allPosts,
      upcomingPosts,
      settings,
      auditLogs,
      readiness,
      insights
    ] = await Promise.all([
      fetchProfileMaterials(),
      fetchPosts({
        limit: 200
      }),
      fetchPosts({
        dateFrom: upcomingRange.start,
        dateTo: upcomingRange.end,
        limit: 40
      }),
      fetchAiSettings(),
      fetchAuditLogs(),
      fetchOperationalReadiness(),
      fetchThreadsInsightsSummary()
    ]);

    const plannedStatuses = new Set(["approved", "scheduled"]);
    const scheduledPosts = upcomingPosts.filter(
      (post) => post.scheduled_at && plannedStatuses.has(post.status)
    );
    const nextScheduledPost = allPosts.find(
      (post) =>
        Boolean(post.scheduled_at) &&
        (post.scheduled_at ?? "") >= upcomingRange.start &&
        plannedStatuses.has(post.status)
    );
    const nextScheduledThreadSegments = nextScheduledPost
      ? splitStoredThreadContent(
          nextScheduledPost.edited_content ??
            nextScheduledPost.generated_content,
          nextScheduledPost.generation_notes?.thread_segments ?? []
        )
      : [];

    const operationalChecks = [
      ...readiness.checks,
      {
        key: "web-auth",
        label: "웹 Google 로그인",
        status: webAuthReady ? "ready" : "blocked",
        message: webAuthReady
          ? "웹에서 Supabase 공개 키를 읽을 수 있습니다."
          : "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 비어 있습니다.",
        details: webAuthReady
          ? undefined
          : ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
      }
    ];
    const blockedCount = readiness.summary.blocked + (webAuthReady ? 0 : 1);
    const warningCount = readiness.summary.warning;
    const readyCount = readiness.summary.ready + (webAuthReady ? 1 : 0);
    const overallStatus =
      blockedCount > 0 ? "blocked" : warningCount > 0 ? "warning" : "ready";
    const categoryBreakdown =
      insights.categoryBreakdown.length > 0
        ? insights.categoryBreakdown
        : Array.from(
            materials
              .reduce(
                (accumulator, item) => {
                  const bucket = accumulator.get(item.category) ?? {
                    category: item.category,
                    postCount: 0,
                    materialCount: 0,
                    totalViews: 0,
                    totalEngagement: 0
                  };
                  bucket.materialCount += 1;
                  accumulator.set(item.category, bucket);
                  return accumulator;
                },
                new Map<
                  string,
                  {
                    category: string;
                    postCount: number;
                    materialCount: number;
                    totalViews: number;
                    totalEngagement: number;
                  }
                >()
              )
              .values()
          );

    return (
      <AppShell
        pathname="/"
        title="운영 개요"
        description="다음 게시 예정 글, 2일 cadence 일정, 원재료 건강도와 최근 성과를 한 화면에서 다룹니다."
      >
        <div className="grid three">
          <section className="card metric">
            <span className="eyebrow">활성 원재료</span>
            <strong>{materials.filter((item) => item.is_active).length}</strong>
            <p className="card-copy">현재 AI가 선택 가능한 원재료 수</p>
          </section>
          <section className="card metric">
            <span className="eyebrow">다음 2주 예정 글</span>
            <strong>{scheduledPosts.length}</strong>
            <p className="card-copy">
              향후 14일 안에 잡혀 있는 예약 또는 게시 일정
            </p>
          </section>
          <section className="card metric">
            <span className="eyebrow">운영 cadence</span>
            <strong>2일 1회</strong>
            <p className="card-copy">
              생성, 복제, 실제 게시까지 같은 간격 규칙 적용
            </p>
          </section>
        </div>

        <section className="card" style={{ marginTop: "1rem" }}>
          <div className="item-head">
            <div>
              <h2 className="card-title">운영 상태 진단</h2>
              <p className="card-copy">
                실운영에 필요한 환경과 외부 연동 상태를 한 번에 확인합니다.
              </p>
            </div>
            <StatusBadge status={overallStatus} />
          </div>
          <div className="item-meta" style={{ marginTop: "0.75rem" }}>
            <span>모드: {readiness.mode}</span>
            <span>ready {readyCount}</span>
            <span>warning {warningCount}</span>
            <span>blocked {blockedCount}</span>
          </div>
          <div className="grid two" style={{ marginTop: "1rem" }}>
            {operationalChecks.map((check) => (
              <article className="card" key={check.key}>
                <div className="item-head">
                  <strong>{check.label}</strong>
                  <StatusBadge status={check.status} />
                </div>
                <p className="card-copy" style={{ marginTop: "0.75rem" }}>
                  {check.message}
                </p>
                {check.details?.length ? (
                  <div
                    className="thread-preview"
                    style={{ marginTop: "0.75rem" }}
                  >
                    {check.details.join("\n")}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <div className="item-head">
            <div>
              <h2 className="card-title">최근 성과 요약</h2>
              <p className="card-copy">
                Threads 인사이트 스냅샷 기준으로 최근 게시 성과를 요약합니다.
              </p>
            </div>
            <div className="item-meta">
              <span>
                마지막 동기화:{" "}
                {insights.lastSyncedAt
                  ? formatDateTime(insights.lastSyncedAt)
                  : "아직 없음"}
              </span>
            </div>
          </div>
          <div className="grid four" style={{ marginTop: "1rem" }}>
            <section className="card metric">
              <span className="eyebrow">팔로워</span>
              <strong>{insights.account?.followersCount ?? 0}</strong>
              <p className="card-copy">최근 계정 스냅샷 기준</p>
            </section>
            <section className="card metric">
              <span className="eyebrow">최근 조회수</span>
              <strong>{insights.summary.recentViewTotal}</strong>
              <p className="card-copy">최근 상위 글 조회수 합계</p>
            </section>
            <section className="card metric">
              <span className="eyebrow">최근 반응 합계</span>
              <strong>{insights.summary.recentEngagementTotal}</strong>
              <p className="card-copy">좋아요·답글·리포스트·인용 합산</p>
            </section>
            <section className="card metric">
              <span className="eyebrow">평균 반응률</span>
              <strong>{insights.summary.averageEngagementRate}%</strong>
              <p className="card-copy">조회수 대비 최근 반응률</p>
            </section>
          </div>
        </section>

        <div className="grid two" style={{ marginTop: "1rem" }}>
          <section className="card">
            <div className="item-head">
              <div>
                <h2 className="card-title">다음 게시 예정</h2>
                <p className="card-copy">
                  가장 가까운 예약 글을 기준으로 편집, 취소, 재생성을 한
                  자리에서 처리합니다.
                </p>
              </div>
              {nextScheduledPost ? (
                <StatusBadge status={nextScheduledPost.status} />
              ) : null}
            </div>

            {nextScheduledPost ? (
              <div className="grid" style={{ marginTop: "1rem" }}>
                <div className="item-meta">
                  <span>{formatDateTime(nextScheduledPost.scheduled_at)}</span>
                  <span>{nextScheduledPost.ai_provider}</span>
                  <span>{nextScheduledPost.ai_model}</span>
                  <span>
                    {getProfileCategoryLabel(
                      nextScheduledPost.source_snapshot?.category
                    )}
                  </span>
                </div>
                <form action={updatePostAction} className="form-grid">
                  <input name="id" type="hidden" value={nextScheduledPost.id} />
                  <div className="field">
                    <label htmlFor="editedContent">최종 편집본</label>
                    <textarea
                      defaultValue={
                        nextScheduledPost.edited_content ??
                        nextScheduledPost.generated_content
                      }
                      id="editedContent"
                      name="editedContent"
                    />
                    <p className="card-copy">
                      이어쓰기 글은 `---` 구분선으로 나뉩니다. 각 구간이
                      Threads의 한 개 글로 순차 게시됩니다.
                    </p>
                  </div>
                  <div className="form-grid two">
                    <div className="field">
                      <label htmlFor="scheduledAt">게시 시간</label>
                      <input
                        defaultValue={formatDateTimeLocalInTimeZone(
                          nextScheduledPost.scheduled_at,
                          settings.timezone
                        )}
                        id="scheduledAt"
                        name="scheduledAt"
                        type="datetime-local"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="status">상태</label>
                      <select
                        defaultValue={nextScheduledPost.status}
                        id="status"
                        name="status"
                      >
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
                <ThreadPreview segments={nextScheduledThreadSegments} />
              </div>
            ) : (
              <EmptyState
                title="다음 예정 글이 없습니다"
                copy="아래 생성 폼으로 초안을 만들거나, 라이브러리에서 다음 cadence 슬롯으로 복제할 수 있습니다."
              />
            )}
          </section>

          <section className="card">
            <h2 className="card-title">새 초안 생성</h2>
            <p className="card-copy">
              기본 설정을 쓰되, 카테고리나 모델을 임시로 바꿔 빠르게 생성할 수
              있습니다. 운영 기본값은 `2일 1회 게시`, `7개 주제 순환`, `중복 시
              수동 재시도`입니다.
            </p>
            <form
              action={generateDraftAction}
              className="form-grid"
              style={{ marginTop: "1rem" }}
            >
              <div className="form-grid two">
                <div className="field">
                  <label htmlFor="category">카테고리 선택</label>
                  <select defaultValue="" id="category" name="category">
                    <option value="">자동 선택</option>
                    {profileCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
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
                  <select
                    defaultValue={settings.default_provider}
                    id="provider"
                    name="provider"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="model">모델</label>
                  <input
                    defaultValue={settings.default_model}
                    id="model"
                    name="model"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="scheduledAt">게시 예정 시각</label>
                <input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                />
                <p className="card-copy">
                  비워두면 초안으로 저장되고, 직접 지정하면 해당 시각으로
                  예약됩니다.
                </p>
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
            <h2 className="card-title">다음 2주 일정</h2>
            {scheduledPosts.length === 0 ? (
              <EmptyState
                title="예정된 일정 없음"
                copy="생성된 글이 쌓이면 이곳에 보입니다."
              />
            ) : (
              <div className="list">
                {scheduledPosts.map((post) => (
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
            <h2 className="card-title">현재 운영 규칙</h2>
            <div className="list">
              <article className="item">
                <div className="item-head">
                  <strong>게시 cadence</strong>
                  <span>2일 1회</span>
                </div>
                <p className="card-copy">
                  자동 생성, 라이브러리 복제, 실제 게시 단계 모두 같은 간격으로
                  강제됩니다.
                </p>
              </article>
              <article className="item">
                <div className="item-head">
                  <strong>주제 운영</strong>
                  <span>7개 순환</span>
                </div>
                <p className="card-copy">
                  고정 주제를 순서대로 돌리고, 최근 원재료는 다시 우선 선택하지
                  않습니다.
                </p>
              </article>
              <article className="item">
                <div className="item-head">
                  <strong>비식별화·중복 방지</strong>
                  <span>저비용 모드</span>
                </div>
                <p className="card-copy">
                  특정 회사명은 일반화해 쓰고, 중복이 감지되면 자동 재생성 대신
                  수동 재시도로 넘깁니다.
                </p>
              </article>
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2 className="card-title">원재료 현황</h2>
          <div className="list">
            {categoryBreakdown.map((summary) => (
              <div className="item" key={summary.category}>
                <div className="item-head">
                  <strong>{getProfileCategoryLabel(summary.category)}</strong>
                  <span>원재료 {summary.materialCount}개</span>
                </div>
                <p className="card-copy">
                  게시 {summary.postCount}건 · 조회수 {summary.totalViews} ·
                  반응 {summary.totalEngagement}
                </p>
                <div className="bar-track" style={{ marginTop: "0.75rem" }}>
                  <div
                    className="bar-fill"
                    style={{
                      width: `${
                        categoryBreakdown[0]?.totalViews
                          ? Math.max(
                              12,
                              (summary.totalViews /
                                categoryBreakdown[0].totalViews) *
                                100
                            )
                          : 12
                      }%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <div className="item-head">
            <div>
              <h2 className="card-title">상위 성과 글</h2>
              <p className="card-copy">
                최근 인사이트 스냅샷에서 조회수 기준으로 정렬한 글입니다.
              </p>
            </div>
          </div>
          {insights.topPosts.length === 0 ? (
            <EmptyState
              title="아직 인사이트가 없습니다"
              copy="Threads 설정 화면에서 인사이트 동기화를 실행하면 이곳에 쌓입니다."
            />
          ) : (
            <div className="list" style={{ marginTop: "1rem" }}>
              {insights.topPosts.map((post) => (
                <article className="item" key={post.postId}>
                  <div className="item-head">
                    <div>
                      <strong>{post.title}</strong>
                      <div className="item-meta">
                        <span>{getProfileCategoryLabel(post.category)}</span>
                        <span>조회수 {post.views}</span>
                        <span>반응 {post.engagement}</span>
                      </div>
                    </div>
                    {post.permalink ? (
                      <a
                        className="button-secondary"
                        href={post.permalink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        글 보기
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2 className="card-title">최근 운영 로그</h2>
          <p className="card-copy">
            초안 생성, 수정, 설정 변경, 작업 실행 기록을 최근 순으로 확인합니다.
          </p>
          {auditLogs.length === 0 ? (
            <EmptyState
              title="운영 로그 없음"
              copy="액션이 발생하면 이곳에 쌓입니다."
            />
          ) : (
            <div className="list" style={{ marginTop: "1rem" }}>
              {auditLogs.map((log) => (
                <article className="item" key={log.id}>
                  <div className="item-head">
                    <strong>{log.action}</strong>
                    <span>{formatDateTime(log.created_at)}</span>
                  </div>
                  <div className="item-meta">
                    <span>{log.entity_type}</span>
                    <span>{log.actor_identifier}</span>
                    {log.entity_id ? <span>{log.entity_id}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
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
            error instanceof Error
              ? error.message
              : "개요 데이터를 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
