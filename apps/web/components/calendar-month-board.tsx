"use client";

import { useState, useTransition } from "react";
import { StatusBadge } from "./status-badge";

type CalendarPost = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string | null;
};

type CalendarMonthBoardProps = {
  monthLabel: string;
  timezoneLabel: string;
  cells: Array<{
    key: string;
    dateKey: string;
    dayNumber: number;
    inMonth: boolean;
    posts: CalendarPost[];
  }>;
  unscheduledPosts: CalendarPost[];
  onReschedule: (formData: FormData) => Promise<void>;
};

function getRescheduleIso(dateKey: string, existingIso: string | null) {
  const existingDate = existingIso ? new Date(existingIso) : null;
  const hours = existingDate?.getHours() ?? 9;
  const minutes = existingDate?.getMinutes() ?? 0;
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(
    year,
    (month ?? 1) - 1,
    day ?? 1,
    hours,
    minutes,
    0
  ).toISOString();
}

function isDraggableStatus(status: string) {
  return ["draft", "approved", "scheduled"].includes(status);
}

export function CalendarMonthBoard({
  monthLabel,
  timezoneLabel,
  cells,
  unscheduledPosts,
  onReschedule
}: CalendarMonthBoardProps) {
  const [isPending, startTransition] = useTransition();
  const [draggedPost, setDraggedPost] = useState<CalendarPost | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  function submitReschedule(post: CalendarPost, dateKey: string) {
    const nextIso = getRescheduleIso(dateKey, post.scheduledAt);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", post.id);
      formData.set("scheduledAt", nextIso);
      await onReschedule(formData);
      setStatusMessage(`${post.title} 일정을 ${dateKey}로 옮겼습니다.`);
    });
  }

  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <section className="card">
        <div className="item-head">
          <div>
            <h2 className="card-title">월간 일정 보드</h2>
            <p className="card-copy">
              {monthLabel} 기준입니다. 카드를 다른 날짜 칸으로 끌어 놓으면 같은
              시각으로 재배치됩니다.
            </p>
          </div>
          <div className="item-meta">
            <span>{timezoneLabel}</span>
            <span>{isPending ? "변경 중" : "드래그로 일정 이동"}</span>
          </div>
        </div>
        {statusMessage ? (
          <div className="alert" style={{ marginTop: "1rem" }}>
            {statusMessage}
          </div>
        ) : null}
        <div className="month-grid" style={{ marginTop: "1rem" }}>
          {["월", "화", "수", "목", "금", "토", "일"].map((label) => (
            <div className="month-grid-head" key={label}>
              {label}
            </div>
          ))}
          {cells.map((cell) => (
            <div
              className={`month-cell${cell.inMonth ? "" : " muted-cell"}${
                draggedPost ? " droppable" : ""
              }`}
              key={cell.key}
              onDragOver={(event) => {
                if (draggedPost) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => {
                event.preventDefault();

                if (!draggedPost) {
                  return;
                }

                submitReschedule(draggedPost, cell.dateKey);
                setDraggedPost(null);
              }}
            >
              <div className="month-cell-day">{cell.dayNumber}</div>
              <div className="month-cell-posts">
                {cell.posts.length === 0 ? (
                  <div className="card-copy">일정 없음</div>
                ) : (
                  cell.posts.map((post) => (
                    <div
                      className={`mini-post${isDraggableStatus(post.status) ? " draggable" : ""}`}
                      draggable={isDraggableStatus(post.status)}
                      key={post.id}
                      onDragEnd={() => setDraggedPost(null)}
                      onDragStart={() => {
                        if (isDraggableStatus(post.status)) {
                          setDraggedPost(post);
                        }
                      }}
                    >
                      <strong>{post.title}</strong>
                      <StatusBadge status={post.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="item-head">
          <div>
            <h2 className="card-title">게시일 미정 / 재배치 대기</h2>
            <p className="card-copy">
              아직 날짜가 없는 글도 바로 월간 보드 위 날짜 칸으로 끌어다 놓을 수
              있습니다.
            </p>
          </div>
        </div>
        {unscheduledPosts.length === 0 ? (
          <div className="card-copy" style={{ marginTop: "1rem" }}>
            미정 상태의 글이 없습니다.
          </div>
        ) : (
          <div className="mini-post-list" style={{ marginTop: "1rem" }}>
            {unscheduledPosts.map((post) => (
              <div
                className="mini-post draggable"
                draggable
                key={post.id}
                onDragEnd={() => setDraggedPost(null)}
                onDragStart={() => setDraggedPost(post)}
              >
                <strong>{post.title}</strong>
                <StatusBadge status={post.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
