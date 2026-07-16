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
});
