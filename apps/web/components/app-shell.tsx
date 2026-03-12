import Link from "next/link";
import { ReactNode } from "react";
import { signOutAction } from "../app/actions";
import { getAdminSessionState } from "../lib/admin";

type NavItem = {
  href: string;
  label: string;
  short: string;
};

const navItems: NavItem[] = [
  { href: "/", label: "개요", short: "OV" },
  { href: "/profile", label: "프로필 원재료", short: "PF" },
  { href: "/calendar", label: "콘텐츠 캘린더", short: "CL" },
  { href: "/library", label: "글 라이브러리", short: "LB" },
  { href: "/settings/ai", label: "AI 설정", short: "AI" }
];

export async function AppShell({
  pathname,
  title,
  description,
  children
}: {
  pathname: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const session = await getAdminSessionState();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-kicker">Philip Designer</span>
          <strong className="brand-title">Threadbot</strong>
          <p className="brand-copy">
            강의 문의와 프로젝트 리드를 만드는 Threads 운영 대시보드
          </p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                className={`nav-link${isActive ? " active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <strong>{item.label}</strong>
                <span>{item.short}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-meta">
            {session.mode === "demo" ? "Demo Mode" : "Supabase Session"}
          </span>
          <strong className="sidebar-email">
            {session.email ?? "로그인 필요"}
          </strong>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div className="title-stack">
            <span className="eyebrow">Admin Workspace</span>
            <h1 className="page-title">{title}</h1>
            <p className="page-copy">{description}</p>
          </div>
          <form action={signOutAction}>
            <button className="button-secondary" type="submit">
              {session.mode === "demo" ? "데모 종료" : "로그아웃"}
            </button>
          </form>
        </header>
        {children}
      </main>
    </div>
  );
}
