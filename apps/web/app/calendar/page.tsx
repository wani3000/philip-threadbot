import { AppShell } from "../../components/app-shell";
import { formatDateTime } from "../../components/date";
import { EmptyState } from "../../components/empty-state";
import { ErrorPanel } from "../../components/error-panel";
import { StatusBadge } from "../../components/status-badge";
import { fetchPosts } from "../../lib/api";

export default async function CalendarPage() {
  try {
    const posts = await fetchPosts({ limit: 60 });

    const groups = posts.reduce<Record<string, typeof posts>>(
      (accumulator, post) => {
        const key = post.scheduled_at
          ? new Date(post.scheduled_at).toISOString().slice(0, 10)
          : "미정";
        accumulator[key] = accumulator[key] ?? [];
        accumulator[key].push(post);
        return accumulator;
      },
      {}
    );

    return (
      <AppShell
        pathname="/calendar"
        title="콘텐츠 캘린더"
        description="게시 예정, 완료, 실패 상태를 날짜 기준으로 확인하고 스케줄 흐름을 추적합니다."
      >
        {posts.length === 0 ? (
          <EmptyState
            title="아직 예정된 글이 없습니다"
            copy="홈에서 초안을 생성하면 이 화면에서 일정 흐름을 확인할 수 있습니다."
          />
        ) : (
          <div className="grid">
            {Object.entries(groups).map(([day, items]) => (
              <section className="card" key={day}>
                <div className="item-head">
                  <div>
                    <h2 className="card-title">
                      {day === "미정" ? "게시일 미정" : day}
                    </h2>
                    <p className="card-copy">
                      {items.length}개의 글이 연결되어 있습니다.
                    </p>
                  </div>
                </div>
                <div className="list">
                  {items.map((post) => (
                    <article className="item" key={post.id}>
                      <div className="item-head">
                        <div>
                          <strong>
                            {post.source_snapshot?.title ?? "제목 없음"}
                          </strong>
                          <div className="item-meta">
                            <span>{formatDateTime(post.scheduled_at)}</span>
                            <span>{post.ai_provider}</span>
                            <span>{post.ai_model}</span>
                          </div>
                        </div>
                        <StatusBadge status={post.status} />
                      </div>
                      <div className="thread-preview">
                        {post.edited_content ?? post.generated_content}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/calendar"
        title="콘텐츠 캘린더"
        description="캘린더 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "캘린더 데이터를 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
