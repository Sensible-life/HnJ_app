"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드", icon: "◧" },
  { href: "/schedule", label: "일정 관리", icon: "◔" },
  { href: "/users", label: "사용자/권한", icon: "◎" },
  { href: "/rooms", label: "객실 타임라인", icon: "▤" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-background-subtle bg-white px-4 py-6 md:flex">
      <div className="px-2">
        <p className="text-sm font-bold text-foreground">BATH PRO</p>
        <p className="text-sm font-bold text-foreground">ROOM PRO</p>
        <p className="mt-1 text-xs text-foreground-secondary">관리자 백오피스</p>
      </div>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-xl bg-nav-active-bg px-3 py-2.5 text-sm font-semibold text-white"
                  : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground-secondary hover:bg-background-subtle"
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
