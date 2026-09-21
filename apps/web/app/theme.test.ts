import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Neobrutalist theme tokens & utilities", () => {
  const globalsCss = fs.readFileSync(
    path.resolve(__dirname, "globals.css"),
    "utf-8"
  );
  const layoutTsx = fs.readFileSync(
    path.resolve(__dirname, "layout.tsx"),
    "utf-8"
  );

  it("defines foundational Neobrutalist CSS tokens in globals.css", () => {
    expect(globalsCss).toContain("--bg-page: #FAFADF");
    expect(globalsCss).toContain("--bg-surface: #FFFFFF");
    expect(globalsCss).toContain("--border: #111111");

    // Pastel accents
    expect(globalsCss).toMatch(/--color-coral:\s*#E8635A|--coral:\s*#E8635A/i);
    expect(globalsCss).toMatch(/--color-lavender:\s*#C4B5FD|--lavender:\s*#C4B5FD/i);
    expect(globalsCss).toMatch(/--color-teal:\s*#4ECDC4|--teal:\s*#4ECDC4/i);
    expect(globalsCss).toMatch(/--color-yellow:\s*#FFE566|--yellow:\s*#FFE566/i);
    expect(globalsCss).toMatch(/--color-pink:\s*#F9A8B8|--pink:\s*#F9A8B8/i);
  });

  it("implements Zero-Blur Hard Shadow utilities and variables", () => {
    expect(globalsCss).toContain("--shadow-md: 4px 4px 0px 0px #111111");
    expect(globalsCss).toContain("--shadow-sm: 3px 3px");
    expect(globalsCss).toContain("--shadow-lg: 6px 6px");
  });

  it("configures DM Sans as primary typography in layout and globals", () => {
    expect(layoutTsx).toMatch(/DM_Sans/);
    expect(globalsCss).toMatch(/--font-sans/);
    expect(globalsCss).toMatch(/tabular-nums/);
  });
});
