"use client";

import { SignOutButton } from "@clerk/nextjs";
import {
  CalendarCheck,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FloatingNavbar, type NavLink } from "@/components/floating-navbar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { destinationsForRole, type AppDestination, type Role } from "@/lib/roles";

type Identity = { name: string; email: string; role: Role };

const IDENTITY_CACHE_KEY = "attendance:identity";

function readCachedIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem(IDENTITY_CACHE_KEY);
  return cached ? (JSON.parse(cached) as Identity) : null;
}

const NAV_ITEMS: Record<AppDestination, NavLink> = {
  "/dashboard": { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  "/events": { href: "/events", label: "Events", icon: CalendarCheck },
  "/my-attendance": {
    href: "/my-attendance",
    label: "My Attendance",
    icon: ClipboardCheck,
  },
  "/clearance": { href: "/clearance", label: "Clearance", icon: ShieldCheck },
  "/admin": { href: "/admin", label: "Administration", icon: ShieldCheck },
  "/students": { href: "/students", label: "Students", icon: Users },
  "/analytics": { href: "/analytics", label: "Reports", icon: FileText },
};

function navForRole(role: Role | null): NavLink[] {
  return role ? destinationsForRole(role).map((href) => NAV_ITEMS[href]) : [];
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [identity, setIdentity] = useState<Identity | null>(readCachedIdentity);

  useEffect(() => {
    fetch("/api/identity")
      .then((res) => (res.ok ? (res.json() as Promise<Identity>) : null))
      .then((next) => {
        setIdentity(next);
        if (next) window.localStorage.setItem(IDENTITY_CACHE_KEY, JSON.stringify(next));
        else window.localStorage.removeItem(IDENTITY_CACHE_KEY);
      });
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg-page)]">
      <FloatingNavbar
        links={navForRole(identity?.role ?? null)}
        right={
          <>
            <span className="hidden truncate text-xs text-muted-foreground lg:inline">
              {identity ? identity.email : ""}
            </span>
            {identity && (
              <SignOutButton redirectUrl="/sign-in">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Log out"
                  onClick={() => window.localStorage.removeItem(IDENTITY_CACHE_KEY)}
                >
                  <LogOut className="size-4" />
                </Button>
              </SignOutButton>
            )}
            <ModeToggle />
          </>
        }
      />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
