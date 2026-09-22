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
import { useQuery } from "@tanstack/react-query";
import { FloatingNavbar, type NavLink } from "@/components/floating-navbar";
import { ModeToggle } from "@/components/mode-toggle";
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
                <Button variant="ghost" size="icon-sm" aria-label="Log out">
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
