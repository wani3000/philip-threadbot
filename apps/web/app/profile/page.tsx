import { AppShell } from "../../components/app-shell";
import { EmptyState } from "../../components/empty-state";
import { ErrorPanel } from "../../components/error-panel";
import { formatRelativeDate } from "../../components/date";
import {
  createProfileMaterialAction,
  deleteProfileMaterialAction,
  updateProfileMaterialAction
} from "../actions";
import { fetchProfileMaterials } from "../../lib/api";

export default async function ProfilePage() {
  try {
    const materials = await fetchProfileMaterials();

    return (
      <AppShell
        pathname="/profile"
        title="프로필 원재료"
        description="필립의 경력, 프로젝트, 강의 경험, 인사이트를 구조화해서 AI 초안의 원재료로 관리합니다."
      >
        <div className="grid two">
          <section className="card">
            <h2 className="card-title">새 원재료 추가</h2>
            <p className="card-copy">
              제목과 긴 설명을 함께 적어두면 이후 AI가 더 좋은 Threads 초안을
              만들 수 있습니다.
            </p>
            <form action={createProfileMaterialAction} className="form-grid">
              <div className="form-grid two">
                <div className="field">
                  <label htmlFor="category">카테고리</label>
                  <select id="category" name="category" defaultValue="career">
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
                  <label htmlFor="priority">우선순위</label>
                  <select id="priority" name="priority" defaultValue="medium">
                    <option value="high">높음</option>
                    <option value="medium">중간</option>
                    <option value="low">낮음</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="title">제목</label>
                <input
                  id="title"
                  name="title"
                  placeholder="예: Apple Developer Academy 강의 경험"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="content">내용</label>
                <textarea
                  id="content"
                  name="content"
                  placeholder="이 경험에서 실제로 배운 점, 사건, 결과를 길게 적어두세요."
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="tags">태그</label>
                <input
                  id="tags"
                  name="tags"
                  placeholder="figma, mentoring, startup"
                />
              </div>
              <div className="actions">
                <button className="button-primary" type="submit">
                  원재료 저장
                </button>
              </div>
            </form>
          </section>

          <section className="card">
            <h2 className="card-title">운영 요약</h2>
            <div className="grid two">
              <div className="metric">
                <span className="eyebrow">총 원재료</span>
                <strong>{materials.length}</strong>
              </div>
              <div className="metric">
                <span className="eyebrow">활성 원재료</span>
                <strong>
                  {materials.filter((item) => item.is_active).length}
                </strong>
              </div>
            </div>
            <div className="list" style={{ marginTop: "1rem" }}>
              {Array.from(
                materials.reduce((accumulator, item) => {
                  accumulator.set(
                    item.category,
                    (accumulator.get(item.category) ?? 0) + 1
                  );
                  return accumulator;
                }, new Map<string, number>())
              ).map(([category, count]) => (
                <div className="item" key={category}>
                  <div className="item-head">
                    <strong>{category}</strong>
                    <span>{count}개</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="card" style={{ marginTop: "1rem" }}>
          <h2 className="card-title">원재료 목록</h2>
          {materials.length === 0 ? (
            <EmptyState
              title="아직 원재료가 없습니다"
              copy="첫 원재료를 추가하면 AI 초안 생성 파이프라인을 바로 테스트할 수 있습니다."
            />
          ) : (
            <div className="list">
              {materials.map((item) => (
                <form
                  action={updateProfileMaterialAction}
                  className="item"
                  key={item.id}
                >
                  <input name="id" type="hidden" value={item.id} />
                  <div className="item-head">
                    <div>
                      <strong>{item.title}</strong>
                      <div className="item-meta">
                        <span>{item.category}</span>
                        <span>우선순위 {item.priority}</span>
                        <span>사용 {item.used_count}회</span>
                        <span>
                          최근 {formatRelativeDate(item.last_used_at)}
                        </span>
                      </div>
                    </div>
                    <label>
                      <input
                        defaultChecked={item.is_active}
                        name="isActive"
                        type="checkbox"
                      />{" "}
                      활성
                    </label>
                  </div>
                  <div className="form-grid two">
                    <div className="field">
                      <label>제목</label>
                      <input defaultValue={item.title} name="title" />
                    </div>
                    <div className="field">
                      <label>카테고리</label>
                      <select defaultValue={item.category} name="category">
                        <option value="career">경력</option>
                        <option value="project">프로젝트</option>
                        <option value="teaching">강의</option>
                        <option value="online_course">온라인 강의</option>
                        <option value="insight">인사이트</option>
                        <option value="vibe_coding">바이브코딩</option>
                        <option value="business">사업 경험</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>내용</label>
                    <textarea defaultValue={item.content} name="content" />
                  </div>
                  <div className="form-grid two">
                    <div className="field">
                      <label>태그</label>
                      <input defaultValue={item.tags.join(", ")} name="tags" />
                    </div>
                    <div className="field">
                      <label>우선순위</label>
                      <select defaultValue={item.priority} name="priority">
                        <option value="high">높음</option>
                        <option value="medium">중간</option>
                        <option value="low">낮음</option>
                      </select>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="button-primary" type="submit">
                      수정 저장
                    </button>
                    <button
                      className="button-danger"
                      formAction={deleteProfileMaterialAction}
                      type="submit"
                    >
                      삭제
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell
        pathname="/profile"
        title="프로필 원재료"
        description="원재료 관리 연결 상태를 확인합니다."
      >
        <ErrorPanel
          message={
            error instanceof Error
              ? error.message
              : "프로필 원재료를 불러오지 못했습니다."
          }
        />
      </AppShell>
    );
  }
}
