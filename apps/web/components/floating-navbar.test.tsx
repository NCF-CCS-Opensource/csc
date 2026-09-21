// @vitest-environment jsdom
import { LayoutDashboard, Users } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { FloatingNavbar } from "./floating-navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

afterEach(() => {
  cleanup();
});

describe("FloatingNavbar", () => {
  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/students", label: "Students", icon: Users },
  ];

  it("renders a labeled navigation landmark with every link", () => {
    render(<FloatingNavbar links={links} />);
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /students/i })).toBeInTheDocument();
  });

  it("marks the link matching the current path as the active page", () => {
    render(<FloatingNavbar links={links} />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: /students/i })).not.toHaveAttribute("aria-current");
  });

  it("renders right-slot content, e.g. sign-out and theme controls", () => {
    render(<FloatingNavbar links={links} right={<button type="button">Log out</button>} />);
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
  });

  it("uses the full available width and provides all links in the compact menu", async () => {
    const { container } = render(<FloatingNavbar links={links} />);

    expect(container.querySelector("nav")).not.toHaveClass("max-w-5xl");

    const menuButton = screen.getByRole("button", { name: /more navigation/i });
    fireEvent.pointerDown(menuButton, { button: 0, ctrlKey: false });
    expect(await screen.findByRole("menuitem", { name: /dashboard/i })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("menuitem", { name: /students/i })).toBeInTheDocument();
  });
});
