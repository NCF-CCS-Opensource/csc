// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

import { Button } from "./button";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Button component", () => {
  it("renders with button role and accessibility attributes", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("handles click events when enabled", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const button = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire click events when disabled", () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("supports asChild composition with Radix Slot", () => {
    render(
      <Button asChild>
        <a href="/login">Log in</a>
      </Button>
    );
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it("renders primary button with 2px border, hard shadow, and press-down tactile classes", () => {
    render(<Button variant="default">Primary Action</Button>);
    const button = screen.getByRole("button", { name: /primary action/i });
    expect(button.className).toContain("border-2");
    expect(button.className).toMatch(/border-\[#111111\]|border-border/);
    expect(button.className).toMatch(/shadow-\[4px_4px_0px_0px_#111111\]|shadow-neo-md/);
    expect(button.className).toContain("hover:translate-x-[2px]");
    expect(button.className).toContain("hover:translate-y-[2px]");
    expect(button.className).toContain("active:translate-x-[4px]");
    expect(button.className).toContain("active:translate-y-[4px]");
  });

  it("renders ghost button with 2px border, hard shadow, and cream hover fill", () => {
    render(<Button variant="ghost">Ghost Action</Button>);
    const button = screen.getByRole("button", { name: /ghost action/i });
    expect(button.className).toContain("border-2");
    expect(button.className).toMatch(/border-\[#111111\]|border-border/);
    expect(button.className).toMatch(/shadow-\[4px_4px_0px_0px_#111111\]|shadow-neo-md/);
    expect(button.className).toContain("hover:bg-[#FAFADF]");
    expect(button.className).toContain("hover:translate-x-[2px]");
    expect(button.className).toContain("hover:translate-y-[2px]");
    expect(button.className).toContain("active:translate-x-[4px]");
    expect(button.className).toContain("active:translate-y-[4px]");
  });

  it("renders pill button with 999px rounded-full radius, 2px border, and press-down states", () => {
    render(<Button variant="pill">Pill CTA</Button>);
    const button = screen.getByRole("button", { name: /pill cta/i });
    expect(button.className).toContain("rounded-full");
    expect(button.className).toContain("border-2");
    expect(button.className).toMatch(/border-\[#111111\]|border-border/);
    expect(button.className).toMatch(/shadow-\[4px_4px_0px_0px_#111111\]|shadow-neo-md/);
    expect(button.className).toContain("hover:translate-x-[2px]");
    expect(button.className).toContain("hover:translate-y-[2px]");
    expect(button.className).toContain("active:translate-x-[4px]");
    expect(button.className).toContain("active:translate-y-[4px]");
  });
});
