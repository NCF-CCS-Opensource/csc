"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/app-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const linkClassName = (active: boolean) =>
    cn(
      "flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-colors",
      active
        ? "border-border bg-[var(--color-yellow)] text-foreground"
        : "border-transparent text-muted-foreground hover:border-border hover:bg-[var(--bg-page)]"
    );

  return (
    <header className="sticky top-4 z-40 mx-4 sm:mx-6">
      <nav
        aria-label="Primary"
        className="flex items-center justify-between gap-4 rounded-[10px] border-2 border-border bg-[var(--bg-surface)] px-4 py-2.5 shadow-[var(--shadow-md)]"
      >
        <Link
          href={brandHref}
          className="flex shrink-0 items-center transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
        >
          <AppLogo size="sm" wordmarkClassName="hidden sm:inline-flex" />
        </Link>

        {links.length > 0 && (
          <ul className="hidden flex-1 items-center justify-center gap-1 2xl:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={linkClassName(active)}
                  >
                    <link.icon className="size-4 shrink-0" />
                    <span className="hidden md:inline">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {links.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More navigation"
                className="flex size-9 items-center justify-center rounded-full border-2 border-border 2xl:hidden"
              >
                <Menu className="size-4" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56 2xl:hidden">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 font-bold",
                        active && "bg-[var(--color-yellow)] text-foreground"
                      )}
                    >
                      <link.icon className="size-4" aria-hidden />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex shrink-0 items-center gap-2">{right}</div>
      </nav>
    </header>
  );
}
