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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FloatingNavbar, type NavLink } from "@/components/floating-navbar";
import { ModeToggle } from "@/components/mode-toggle";
import { NavProgressBar } from "@/components/nav-progress-bar";
import { Button } from "@/components/ui/button";
import type { Identity } from "@/lib/auth";
import { getIdentity } from "@/lib/queries/identity";
import { identityQueryKey } from "@/lib/queries/identity.query-key";
import { destinationsForRole, type AppDestination, type Role } from "@/lib/roles";

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

export function AppShell({
  initialIdentity,
  children,
}: Readonly<{
  initialIdentity: Identity | null;
  children: React.ReactNode;
}>) {
  // Seeded from the server shell (same server-side resolution the page's own
  // gate already made), so a cold visit paints with identity already known
  // and a revisit paints from the persisted cache while a background
  // refetch replaces it (issue #285, ADR 0013).
  const { data: identity } = useQuery({
    queryKey: identityQueryKey,
    queryFn: getIdentity,
    initialData: initialIdentity,
  });
  const queryClient = useQueryClient();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg-page)]">
      <NavProgressBar />
      <FloatingNavbar
        links={navForRole(identity?.role ?? null)}
        right={
          <>
            <span className="hidden truncate text-xs text-muted-foreground lg:inline">
              {identity ? identity.email : ""}
            </span>
            {identity && (
              <SignOutButton redirectUrl="/">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Log out"
                  // Identity now lives in the same shared, localStorage-persisted
                  // cache as every other page's data (ADR 0013), so a plain
                  // localStorage.removeItem for one key no longer clears it on
                  // sign-out. Clear the whole client cache instead, so the next
                  // Student to use this browser never sees a prior Student's
                  // cached identity or data.
                  onClick={() => queryClient.clear()}
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
