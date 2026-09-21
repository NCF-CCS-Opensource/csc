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
  it("renders with badge text and slot data", () => {
    render(<Badge>Active</Badge>);
    const badge = screen.getByText(/active/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("renders with 2px border and 999px pill radius (rounded-full)", () => {
    render(<Badge>Status Pill</Badge>);
    const badge = screen.getByText(/status pill/i);
    expect(badge.className).toContain("border-2");
    expect(badge.className).toMatch(/border-\[#111111\]|border-border/);
    expect(badge.className).toContain("rounded-full");
  });

  it("renders status variants with correct contrast colors and 2px borders", () => {
    const { rerender } = render(<Badge variant="present">Present</Badge>);
    let badge = screen.getByText(/present/i);
    expect(badge.className).toContain("bg-[#4ECDC4]");
    expect(badge.className).toContain("text-[#111111]");
    expect(badge.className).toContain("border-2");

    rerender(<Badge variant="incomplete">Incomplete</Badge>);
    badge = screen.getByText(/incomplete/i);
    expect(badge.className).toContain("bg-[#FFE566]");
    expect(badge.className).toContain("text-[#111111]");

    rerender(<Badge variant="absent">Absent</Badge>);
    badge = screen.getByText(/absent/i);
    expect(badge.className).toContain("bg-[#E8635A]");
    expect(badge.className).toContain("text-white");

    rerender(<Badge variant="cleared">Cleared</Badge>);
    badge = screen.getByText(/cleared/i);
    expect(badge.className).toContain("bg-[#C4B5FD]");
    expect(badge.className).toContain("text-[#111111]");
  });

  it("supports outline variant with white background and black border", () => {
    render(<Badge variant="outline">Outlined</Badge>);
    const badge = screen.getByText(/outlined/i);
    expect(badge.className).toContain("border-2");
    expect(badge.className).toContain("bg-white");
    expect(badge.className).toContain("text-[#111111]");
  });

  it("merges custom className without losing core styling", () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText(/custom/i);
    expect(badge.className).toContain("custom-class");
    expect(badge.className).toContain("border-2");
    expect(badge.className).toContain("rounded-full");
  });
});
