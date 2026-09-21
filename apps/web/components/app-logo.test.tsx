// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { AppLogo, AppLogoMark } from "./app-logo";

afterEach(() => {
  cleanup();
});

describe("AppLogo", () => {
  it("renders the SVG mark with accessible role and label", () => {
    render(<AppLogoMark />);
    const mark = screen.getByRole("img", { name: /ccs attendance mark/i });
    expect(mark).toBeInTheDocument();
  });

  it("renders with wordmark text by default", () => {
    render(<AppLogo />);
    expect(screen.getByText("CCS Attendance")).toBeInTheDocument();
  });

  it("renders optional institutional tagline when showTagline is true", () => {
    render(<AppLogo showTagline />);
    expect(screen.getByText("College of Computer Studies")).toBeInTheDocument();
  });

  it("hides wordmark when showWordmark is false", () => {
    render(<AppLogo showWordmark={false} />);
    expect(screen.queryByText("CCS Attendance")).not.toBeInTheDocument();
  });

  it("applies custom size to AppLogoMark", () => {
    render(<AppLogoMark size="lg" data-testid="logo-mark" />);
    const mark = screen.getByTestId("logo-mark");
    expect(mark).toHaveAttribute("width", "48");
    expect(mark).toHaveAttribute("height", "48");
  });
});
