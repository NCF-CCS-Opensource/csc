// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

import { Badge } from "./badge";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Badge component", () => {
  it("renders with badge text, slot data, and default status accessibility role", () => {
    render(<Badge>Active</Badge>);
    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Active");
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("renders with 2px border and 999px pill radius (rounded-full)", () => {
    render(<Badge>Status Pill</Badge>);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("border-2");
    expect(badge.className).toContain("border-border");
    expect(badge.className).toContain("rounded-full");
  });

  it("renders status variants with correct contrast colors and 2px borders", () => {
    const { rerender } = render(<Badge variant="present">Present</Badge>);
    let badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-[var(--color-teal)]");
    expect(badge.className).toContain("text-foreground");
    expect(badge.className).toContain("border-2");

    rerender(<Badge variant="incomplete">Incomplete</Badge>);
    badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-[var(--color-yellow)]");
    expect(badge.className).toContain("text-foreground");

    rerender(<Badge variant="absent">Absent</Badge>);
    badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-[var(--color-coral)]");
    expect(badge.className).toContain("text-white");

    rerender(<Badge variant="cleared">Cleared</Badge>);
    badge = screen.getByRole("status");
    expect(badge.className).toContain("bg-[var(--color-lavender)]");
    expect(badge.className).toContain("text-foreground");
  });

  it("supports outline variant with card background and border", () => {
    render(<Badge variant="outline">Outlined</Badge>);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("border-2");
    expect(badge.className).toContain("bg-card");
    expect(badge.className).toContain("text-foreground");
  });

  it("merges custom className without losing core styling", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("custom-class");
    expect(badge.className).toContain("border-2");
    expect(badge.className).toContain("rounded-full");
  });
});
