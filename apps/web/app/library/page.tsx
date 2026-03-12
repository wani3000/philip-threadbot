import { AppShell } from "../../components/app-shell";
import { formatDateTime } from "../../components/date";
import { EmptyState } from "../../components/empty-state";
import { ErrorPanel } from "../../components/error-panel";
import { StatusBadge } from "../../components/status-badge";
import { fetchPosts } from "../../lib/api";
import { getProfileCategoryLabel } from "../../lib/profile-categories";

export default async function LibraryPage() {
  try {
    const posts = await fetchPosts({ limit: 100 });

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
          <div className="list">
            {posts.map((post) => (
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
                <div className="thread-preview">
                  {post.edited_content ?? post.generated_content}
                </div>
                {!!post.source_snapshot?.tags?.length && (
                  <div className="tag-row">
                    {post.source_snapshot.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
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
