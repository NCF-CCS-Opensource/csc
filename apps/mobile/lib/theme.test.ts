import { describe, expect, it } from "vitest";
import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("light preference is light regardless of system", () => {
    expect(resolveTheme("light", "dark").mode).toBe("light");
    expect(resolveTheme("light", "light").mode).toBe("light");
  });

  it("dark preference is dark regardless of system", () => {
    expect(resolveTheme("dark", "light").mode).toBe("dark");
    expect(resolveTheme("dark", "dark").mode).toBe("dark");
  });

  it("system follows the OS scheme", () => {
    expect(resolveTheme("system", "dark").mode).toBe("dark");
    expect(resolveTheme("system", "light").mode).toBe("light");
  });

  it("system falls back to light when OS scheme is unknown", () => {
    expect(resolveTheme("system", null).mode).toBe("light");
    expect(resolveTheme("system", undefined).mode).toBe("light");
  });

  it("exposes the neobrutalist design-foundation palette in both schemes", () => {
    const light = resolveTheme("light", null);
    const dark = resolveTheme("dark", null);
    expect(light.neoBgPage).toBe("#FAFADF");
    expect(light.neoBorder).toBe("#111111");
    expect(dark.neoBgPage).toBe("#121212");
    expect(dark.neoBorder).toBe("#FFFFFF");
    // Accent colors stay identical across schemes, per apps/web's .dark block.
    for (const scheme of [light, dark]) {
      expect(scheme.neoPrimary).toBe("#E8635A");
      expect(scheme.neoSecondary).toBe("#7B6CF6");
      expect(scheme.neoLavender).toBe("#C4B5FD");
      expect(scheme.neoTeal).toBe("#4ECDC4");
      expect(scheme.neoYellow).toBe("#FFE566");
      expect(scheme.neoPink).toBe("#F9A8B8");
    }
  });
});
