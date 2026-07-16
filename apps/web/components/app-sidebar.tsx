"use client";

import { BarChart3, CalendarCheck, LayoutDashboard, LogOut, ScanLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/(app)/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import type { Role } from "@/lib/roles";

type Identity = { name: string; email: string; role: Role };

const IDENTITY_CACHE_KEY = "attendance:identity";

function readCachedIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  const cached = window.localStorage.getItem(IDENTITY_CACHE_KEY);
  return cached ? (JSON.parse(cached) as Identity) : null;
}

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const STUDENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const OFFICER_NAV: NavItem[] = [
  { href: "/events", label: "My Events", icon: CalendarCheck },
  { href: "/clearance", label: "Clearance", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const GOVERNOR_NAV: NavItem[] = [{ href: "/admin", label: "Admin", icon: ShieldCheck }];

function navForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  if (role === "governor") return [...STUDENT_NAV, ...OFFICER_NAV, ...GOVERNOR_NAV];
  if (role === "officer") return [...STUDENT_NAV, ...OFFICER_NAV];
  return STUDENT_NAV;
}

export function AppSidebar() {
  const pathname = usePathname();
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

  const items = navForRole(identity?.role ?? null);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1 font-semibold">
          <ScanLine className="size-5 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">CCS Attendance</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <span className="truncate text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            {identity ? identity.email : "Not signed in"}
          </span>
          <div className="flex items-center gap-1">
            {identity && (
              <form action={logout}>
                <button
                  type="submit"
                  onClick={() => window.localStorage.removeItem(IDENTITY_CACHE_KEY)}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground rounded p-1.5"
                  title="Log out"
                >
                  <LogOut className="size-4" />
                </button>
              </form>
            )}
            <ModeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
