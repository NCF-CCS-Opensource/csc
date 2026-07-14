"use client";

import {
  BarChart3,
  CalendarCheck,
  LayoutDashboard,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import type { Identity } from "@/lib/auth";
import type { Role } from "@/lib/roles";

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
  if (!role) return [{ href: "/register", label: "Register", icon: UserPlus }];
  if (role === "governor") return [...STUDENT_NAV, ...OFFICER_NAV, ...GOVERNOR_NAV];
  if (role === "officer") return [...STUDENT_NAV, ...OFFICER_NAV];
  return STUDENT_NAV;
}

export function AppSidebar({ identity }: { identity: Identity | null }) {
  const pathname = usePathname();
  const items = navForRole(identity?.role ?? null);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 px-2 py-1 font-semibold">
          CCS Attendance
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
          <ModeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
