// Structurally typed against react-native's Linking module rather than
// importing it: react-native's entry point is Flow-typed and Vitest (Vite's
// esbuild/rollup pipeline) can't parse Flow syntax, so importing it here
// would break `vitest run` even though the app itself builds fine via Metro.
export type LinkingLike = {
  addEventListener: (
    event: "url",
    handler: (e: { url: string }) => void,
  ) => { remove: () => void };
  getInitialURL: () => Promise<string | null>;
};

/**
 * expo-web-browser's Android path races an AppState "resumed" listener
 * against Linking's "url" listener and can settle on AppState first,
 * reporting the SSO flow as dismissed even though Google auth succeeded.
 *
 * `Linking.getInitialURL()` alone isn't enough to recover from that: it
 * only resolves a value when the app was cold-launched by the link. The
 * common case here is the app merely backgrounded while the system
 * browser was open, then resumed — no cold launch, so getInitialURL()
 * returns null and recovery silently does nothing. Subscribing to the
 * "url" event ourselves, in parallel with expo-web-browser's own
 * listener, catches the redirect in that case too.
 */
export function watchForRedirectUrl(linking: LinkingLike) {
  let capturedUrl: string | null = null;
  const subscription = linking.addEventListener("url", ({ url }) => {
    capturedUrl = url;
  });
  return {
    async resolve(): Promise<string | null> {
      return capturedUrl ?? (await linking.getInitialURL());
    },
    stop() {
      subscription.remove();
    },
  };
}

/**
 * Custom URI schemes come back in two shapes depending on the sender:
 * hierarchical ("attendkita://host?query", what AuthSession.makeRedirectUri()
 * produces) and opaque ("attendkita:?query", what Clerk's redirect actually
 * sends — no "//" authority). A plain `startsWith(expectedPrefix)` only
 * matches the first shape, so a legitimate redirect in the second shape gets
 * silently rejected. Comparing parsed `protocol` handles both shapes, but
 * `attendkita://` is a custom scheme, not an OS-verified App/Universal Link —
 * any other app on the device can register the same scheme and race to
 * deliver its own redirect. Checking only `protocol` would accept that,
 * since a malicious sender can freely set host/pathname too. Requiring
 * host and pathname to match the expected redirect (once normalized: an
 * absent host/root pathname on either side counts as empty) closes that
 * without breaking either legitimate shape, since expo-auth-session's
 * generated `redirectUri` for this scheme carries no meaningful host/path
 * of its own.
 *
 * This is a same-scheme-squatting mitigation, not the complete fix: a
 * malicious app registering `attendkita://` can still send a URL with an
 * empty host/path, which is indistinguishable from Clerk's real redirect at
 * this layer (Clerk's own rotating-token nonce binding is what limits the
 * damage from there — see L-2 in .security-hardening/01-vulnerability-scan.md).
 * The complete fix is migrating to Android App Links / iOS Universal Links,
 * which are OS-verified against a hosted assetlinks.json /
 * apple-app-site-association and can't be squatted by another app declaring
 * the same custom scheme; that needs a domain to host those files and is out
 * of scope for this pass.
 */
export function matchesRedirectScheme(url: string, redirectUri: string): boolean {
  try {
    const actual = new URL(url);
    const expected = new URL(redirectUri);
    if (actual.protocol !== expected.protocol) return false;
    const normalizedPath = (p: string) => (p === "/" ? "" : p);
    return (
      actual.host === expected.host &&
      normalizedPath(actual.pathname) === normalizedPath(expected.pathname)
    );
  } catch {
    return false;
  }
}
