// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import { MarketingLanding } from "./marketing-landing";

afterEach(() => {
  cleanup();
});

function renderLanding(signedIn = false) {
  return render(<MarketingLanding signedIn={signedIn} />);
}

describe("MarketingLanding (public home page)", () => {
  it("renders a hero that sells the product to a visitor who does not know CCS domain terms", () => {
    renderLanding();

    expect(screen.getByRole("heading", { level: 1, name: /ccs attendance/i })).toBeInTheDocument();
    expect(within(screen.getByTestId("hero")).getByText("College of Computer Studies")).toBeInTheDocument();
    expect(screen.getByText(/no more paper sign-in sheets/i)).toBeInTheDocument();
  });

  it("keeps the sign-in CTA prominent and routes signed-in visitors to the dashboard", () => {
    renderLanding(false);
    const signInCta = screen.getByTestId("hero-cta");
    expect(signInCta).toHaveAttribute("href", "/sign-in");
    expect(signInCta).toHaveAccessibleName(/continue with your school google account/i);

    cleanup();
    renderLanding(true);
    const dashboardCta = screen.getByTestId("hero-cta");
    expect(dashboardCta).toHaveAttribute("href", "/dashboard");
    expect(dashboardCta).toHaveAccessibleName(/go to dashboard/i);
    expect(
      screen.queryByRole("link", { name: /continue with your school google account/i })
    ).not.toBeInTheDocument();
  });

  it("explains the product value: QR check-in, penalty ledger, clearance gate, and policy fidelity", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", { name: /attendance without the clipboard/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /scan in, scan out/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /a penalty ledger that adds itself up/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /clearance you can verify/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /CCS rules, enforced/i })).toBeInTheDocument();
  });

  function roleCard(name: RegExp) {
    return screen.getByRole("heading", { name }).closest<HTMLElement>('[data-slot="role-card"]')!;
  }

  it("tells a first-time visitor who the system is for, with role-specific value", () => {
    renderLanding();

    const studentCard = roleCard(/student/i);
    expect(within(studentCard).getByText(/attendance history/i)).toBeInTheDocument();
    expect(within(studentCard).getByText(/your own QR card/i)).toBeInTheDocument();

    const officerCard = roleCard(/officer/i);
    expect(within(officerCard).getByText(/scan booth/i)).toBeInTheDocument();
    expect(within(officerCard).getByText(/record payments/i)).toBeInTheDocument();

    const governorCard = roleCard(/governor/i);
    expect(within(governorCard).getByText(/semester cycle/i)).toBeInTheDocument();
    expect(within(governorCard).getByText(/official PDF reports with AI narratives/i)).toBeInTheDocument();
  });

  it("walks a visitor through how it works in three numbered steps", () => {
    renderLanding();

    const steps = screen.getAllByTestId("how-it-works-step");
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent(/sign in & grab your QR/i);
    expect(steps[1]).toHaveTextContent(/scan in at every session/i);
    expect(steps[2]).toHaveTextContent(/watch the ledger, then clear/i);
  });

  it("closes with a CTA band and footer, keeping the primary action reachable", () => {
    renderLanding(false);

    expect(
      screen.getByRole("heading", { name: /your attendance, finally on a ledger/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId("band-cta")).toHaveAttribute("href", "/sign-in");
    expect(screen.getByTestId("band-cta")).toHaveAccessibleName(
      /continue with your school google account/i
    );

    expect(screen.getByTestId("landing-footer")).toHaveTextContent(/CCS Attendance/i);
    expect(screen.getByTestId("landing-footer")).toHaveTextContent(/College of Computer Studies/i);

    const seeHow = screen.getByRole("link", { name: /see how it works/i });
    expect(seeHow).toHaveAttribute("href", "/#how-it-works");
  });
});