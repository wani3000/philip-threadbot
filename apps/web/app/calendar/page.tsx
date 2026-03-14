import { AppShell } from "../../components/app-shell";
import { CalendarMonthBoard } from "../../components/calendar-month-board";
import { ErrorPanel } from "../../components/error-panel";
import { fetchAiSettings, fetchPosts } from "../../lib/api";
import { rescheduleCalendarPostAction } from "../actions";

type CalendarPageProps = {
  searchParams?: {
    month?: string;
  };
};

function formatDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function getMonthSeed(monthParam?: string) {
  if (monthParam && /^\d{4}-\d{2}$/u.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    return new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  }

  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function getAdjacentMonth(monthSeed: Date, offset: number) {
  return new Date(
    Date.UTC(monthSeed.getUTCFullYear(), monthSeed.getUTCMonth() + offset, 1)
  );
}

function buildMonthCells(monthSeed: Date, timeZone: string) {
  const monthStart = new Date(monthSeed);
  const firstDay = monthStart.getUTCDay();
  const mondayStartOffset = firstDay === 0 ? -6 : 1 - firstDay;
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() + mondayStartOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);

    return {
      date,
      dateKey: formatDateKey(date, timeZone),
      dayNumber: Number(
        new Intl.DateTimeFormat("en-CA", {
          timeZone,
          day: "2-digit"
        }).format(date)
      ),
      inMonth:
        date.getUTCMonth() === monthSeed.getUTCMonth() &&
        date.getUTCFullYear() === monthSeed.getUTCFullYear()
    };
  });
}

export default async function CalendarPage({
  searchParams
}: CalendarPageProps) {
  try {
    const settings = await fetchAiSettings();
    const posts = await fetchPosts({ limit: 120 });
    const monthSeed = getMonthSeed(searchParams?.month);
    const previousMonth = getAdjacentMonth(monthSeed, -1);
    const nextMonth = getAdjacentMonth(monthSeed, 1);
    const cells = buildMonthCells(monthSeed, settings.timezone);

    const scheduledPosts = posts
      .filter((post) => post.scheduled_at)
      .map((post) => ({
        id: post.id,
        title: post.source_snapshot?.title ?? "제목 없음",
        status: post.status,
        scheduledAt: post.scheduled_at,
        dateKey: formatDateKey(new Date(post.scheduled_at!), settings.timezone)
      }));

    const monthCells = cells.map((cell) => ({
      key: cell.date.toISOString(),
      dateKey: cell.dateKey,
      dayNumber: cell.dayNumber,
      inMonth: cell.inMonth,
      posts: scheduledPosts
        .filter((post) => post.dateKey === cell.dateKey)
        .map((post) => ({
          id: post.id,
          title: post.title,
          status: post.status,
          scheduledAt: post.scheduledAt
        }))
    }));

    const unscheduledPosts = posts
      .filter((post) => !post.scheduled_at && post.status !== "published")
      .map((post) => ({
        id: post.id,
        title: post.source_snapshot?.title ?? "제목 없음",
        status: post.status,
        scheduledAt: post.scheduled_at
      }));

    const monthLabel = new Intl.DateTimeFormat("ko-KR", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "long"
    }).format(monthSeed);

    return (
      <AppShell
        pathname="/calendar"
        title="콘텐츠 캘린더"
        description="월간 일정 보드에서 게시 흐름을 보고, 글 카드를 드래그해서 날짜를 옮길 수 있습니다."
      >
        <div className="actions" style={{ marginBottom: "1rem" }}>
          <a
            className="button-secondary"
            href={`/calendar?month=${formatDateKey(previousMonth, "UTC").slice(0, 7)}`}
          >
            이전 달
          </a>
          <a className="button-secondary" href="/calendar">
            이번 달
          </a>
          <a
            className="button-secondary"
            href={`/calendar?month=${formatDateKey(nextMonth, "UTC").slice(0, 7)}`}
          >
            다음 달
          </a>
        </div>

        <CalendarMonthBoard
          cells={monthCells}
          monthLabel={monthLabel}
          onReschedule={rescheduleCalendarPostAction}
          timezoneLabel={settings.timezone}
          unscheduledPosts={unscheduledPosts}
        />
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
