import { describe, expect, it, vi } from "vitest";
import { matchesRedirectScheme, watchForRedirectUrl, type LinkingLike } from "./ssoRedirect";

type UrlHandler = (event: { url: string }) => void;

function fakeLinking(getInitialURL: () => Promise<string | null>) {
  let handler: UrlHandler | null = null;
  const linking: LinkingLike = {
    addEventListener: vi.fn((_event, cb: UrlHandler) => {
      handler = cb;
      return { remove: vi.fn() };
    }) as unknown as LinkingLike["addEventListener"],
    getInitialURL,
  };
  return { linking, fireUrl: (url: string) => handler?.(url ? { url } : { url }) };
}

describe("watchForRedirectUrl", () => {
  it("recovers the redirect from getInitialURL on a cold launch", async () => {
    const { linking } = fakeLinking(() => Promise.resolve("myapp://sso?rotating_token_nonce=abc"));
    const watcher = watchForRedirectUrl(linking);

    await expect(watcher.resolve()).resolves.toBe("myapp://sso?rotating_token_nonce=abc");
  });

  it("recovers the redirect from the url event on a warm resume (getInitialURL is null)", async () => {
    const { linking, fireUrl } = fakeLinking(() => Promise.resolve(null));
    const watcher = watchForRedirectUrl(linking);

    fireUrl("myapp://sso?rotating_token_nonce=xyz");

    await expect(watcher.resolve()).resolves.toBe("myapp://sso?rotating_token_nonce=xyz");
  });

  it("returns null when the sign-in was genuinely dismissed", async () => {
    const { linking } = fakeLinking(() => Promise.resolve(null));
    const watcher = watchForRedirectUrl(linking);

    await expect(watcher.resolve()).resolves.toBeNull();
  });
});

describe("matchesRedirectScheme", () => {
  it("matches Clerk's actual opaque-form redirect against a hierarchical expected prefix", () => {
    // Real device repro: Clerk redirects with no "//" authority.
    const redirectedUrl =
      "attendkita:?created_session_id=sess_3Hi0i9T9FC4gW6osEIw3KUjxzv6&rotating_token_nonce=nq548dohjd3e89286fnd8jxdpyxwhhileco7cwqi";
    expect(matchesRedirectScheme(redirectedUrl, "attendkita://")).toBe(true);
  });

  it("matches the hierarchical form too", () => {
    expect(matchesRedirectScheme("attendkita://sso-callback?x=1", "attendkita://")).toBe(true);
  });

  it("rejects a redirect for a different app scheme", () => {
    expect(matchesRedirectScheme("otherapp://callback", "attendkita://")).toBe(false);
  });

  it("rejects an unparseable url", () => {
    expect(matchesRedirectScheme("not a url", "attendkita://")).toBe(false);
  });
});
