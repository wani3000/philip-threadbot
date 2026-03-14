import { AppShell } from "../../components/app-shell";
import { formatDateTime } from "../../components/date";
import { EmptyState } from "../../components/empty-state";
import { ErrorPanel } from "../../components/error-panel";
import { StatusBadge } from "../../components/status-badge";
import { ThreadPreview } from "../../components/thread-preview";
import { fetchPosts, fetchThreadsInsightsSummary } from "../../lib/api";
import { getProfileCategoryLabel } from "../../lib/profile-categories";
import { splitStoredThreadContent } from "../../lib/thread-content";
import { reusePostAsDraftAction, reusePostForTomorrowAction } from "../actions";

type LibraryPageProps = {
  searchParams?: {
    q?: string;
    status?: string;
    category?: string;
    model?: string;
  };
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  try {
    const [posts, insights] = await Promise.all([
      fetchPosts({ limit: 100 }),
      fetchThreadsInsightsSummary()
    ]);
    const keyword = searchParams?.q?.trim().toLowerCase() ?? "";
    const statusFilter = searchParams?.status?.trim() ?? "";
    const categoryFilter = searchParams?.category?.trim() ?? "";
    const modelFilter = searchParams?.model?.trim().toLowerCase() ?? "";

    const filteredPosts = posts.filter((post) => {
      const content = `${post.generated_content} ${post.edited_content ?? ""} ${
        post.source_snapshot?.title ?? ""
      } ${post.source_snapshot?.tags?.join(" ") ?? ""}`.toLowerCase();

      if (keyword && !content.includes(keyword)) {
        return false;
      }

      if (statusFilter && post.status !== statusFilter) {
        return false;
      }

      if (
        categoryFilter &&
        (post.source_snapshot?.category ?? "") !== categoryFilter
      ) {
        return false;
      }

      if (modelFilter && !post.ai_model.toLowerCase().includes(modelFilter)) {
        return false;
      }

      return true;
    });

    const categories = Array.from(
      new Set(
        posts.map((post) => post.source_snapshot?.category).filter(Boolean)
      )
    );
    const models = Array.from(new Set(posts.map((post) => post.ai_model)));
    const insightByPostId = new Map(
      insights.latestPosts.map((post) => [post.postId, post])
    );

    return (
      <AppShell
        pathname="/library"
        title="글 라이브러리"
        description="생성된 글을 전체 이력 관점에서 보고, 모델과 상태, 원재료 맥락을 함께 확인합니다."
      >
        {posts.length === 0 ? (
          <EmptyState
            title="저장된 글이 없습니다"
            copy="초안을 생성하면 이 화면에서 전체 글 이력을 검색하듯 확인할 수 있습니다."
          />
        ) : (
          <div className="grid">
            <section className="card">
              <h2 className="card-title">필터</h2>
              <form
                className="form-grid"
                method="get"
                style={{ marginTop: "1rem" }}
              >
                <div className="field">
                  <label htmlFor="q">검색어</label>
                  <input defaultValue={searchParams?.q ?? ""} id="q" name="q" />
                </div>
                <div className="form-grid two">
                  <div className="field">
                    <label htmlFor="status">상태</label>
                    <select
                      defaultValue={statusFilter}
                      id="status"
                      name="status"
                    >
                      <option value="">전체</option>
                      <option value="draft">draft</option>
                      <option value="approved">approved</option>
                      <option value="scheduled">scheduled</option>
                      <option value="published">published</option>
                      <option value="failed">failed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="category">카테고리</label>
                    <select
                      defaultValue={categoryFilter}
                      id="category"
                      name="category"
                    >
                      <option value="">전체</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {getProfileCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="model">모델</label>
                  <select
                    defaultValue={searchParams?.model ?? ""}
                    id="model"
                    name="model"
                  >
                    <option value="">전체</option>
                    {models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="actions">
                  <button className="button-primary" type="submit">
                    적용
                  </button>
                  <a className="button-secondary" href="/library">
                    초기화
                  </a>
                </div>
              </form>
            </section>

            {filteredPosts.length === 0 ? (
              <EmptyState
                title="조건에 맞는 글이 없습니다"
                copy="검색어나 상태, 카테고리 조건을 바꿔 다시 확인해 보세요."
              />
            ) : (
              <div className="list">
                {filteredPosts.map((post) => (
                  <article className="card" key={post.id}>
                    <div className="item-head">
                      <div>
                        <h2 className="card-title">
                          {post.source_snapshot?.title ?? "원재료 제목 없음"}
                        </h2>
                        <div className="item-meta">
                          <span>{formatDateTime(post.created_at)}</span>
                          <span>
                            {getProfileCategoryLabel(
                              post.source_snapshot?.category
                            )}
                          </span>
                          <span>{post.ai_provider}</span>
                          <span>{post.ai_model}</span>
                        </div>
                      </div>
                      <StatusBadge status={post.status} />
                    </div>
                    <ThreadPreview
                      segments={splitStoredThreadContent(
                        post.edited_content ?? post.generated_content,
                        post.generation_notes?.thread_segments ?? []
                      )}
                    />
                    {insightByPostId.has(post.id) ? (
                      <div
                        className="item-meta"
                        style={{ marginTop: "0.75rem" }}
                      >
                        <span>
                          조회수 {insightByPostId.get(post.id)?.views ?? 0}
                        </span>
                        <span>
                          반응 {insightByPostId.get(post.id)?.engagement ?? 0}
                        </span>
                        <span>
                          답글 {insightByPostId.get(post.id)?.replies ?? 0}
                        </span>
                      </div>
                    ) : null}
                    {!!post.source_snapshot?.tags?.length && (
                      <div className="tag-row">
                        {post.source_snapshot.tags.map((tag) => (
                          <span className="tag" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="actions">
                      <form action={reusePostAsDraftAction}>
                        <input name="id" type="hidden" value={post.id} />
                        <button className="button-secondary" type="submit">
                          새 초안으로 재사용
                        </button>
                      </form>
                      <form action={reusePostForTomorrowAction}>
                        <input name="id" type="hidden" value={post.id} />
                        <button className="button-primary" type="submit">
                          내일 일정으로 복제
                        </button>
                      </form>
                      {post.thread_permalink ? (
                        <a
                          className="button-secondary"
                          href={post.thread_permalink}
                          rel="noreferrer"
                          target="_blank"
                        >
                          게시 글 열기
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/library"
        title="글 라이브러리"
        description="라이브러리 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "글 라이브러리를 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
