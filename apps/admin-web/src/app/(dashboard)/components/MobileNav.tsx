"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/schedule", label: "일정" },
  { href: "/users", label: "사용자" },
  { href: "/rooms", label: "타임라인" },
  { href: "/rates", label: "요금" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-background-subtle bg-white px-4 py-3 md:hidden">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "shrink-0 rounded-full bg-nav-active-bg px-4 py-2 text-xs font-semibold text-white"
                : "shrink-0 rounded-full bg-background-subtle px-4 py-2 text-xs font-medium text-foreground-secondary"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
