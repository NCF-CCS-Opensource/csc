"use client";

import { ScanLine } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function FloatingNavbar({
  links = [],
  brandHref = "/",
  right,
}: Readonly<{
  links?: NavLink[];
  brandHref?: string;
  right?: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 mx-4 sm:mx-6">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-[10px] border-2 border-border bg-[var(--bg-surface)] px-4 py-2.5 shadow-[var(--shadow-md)]"
      >
        <Link
          href={brandHref}
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-border bg-[var(--color-yellow)]">
            <ScanLine className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">CCS Attendance</span>
        </Link>

        {links.length > 0 && (
          <ul className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
                      active
                        ? "border-border bg-[var(--color-yellow)] text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-[var(--bg-page)]"
                    )}
                  >
                    <link.icon className="size-4 shrink-0" />
                    <span className="hidden md:inline">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex shrink-0 items-center gap-2">{right}</div>
      </nav>
    </header>
  );
}
