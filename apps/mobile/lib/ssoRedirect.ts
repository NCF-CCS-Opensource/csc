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
 * silently rejected. Comparing parsed `protocol` handles both.
 */
export function matchesRedirectScheme(url: string, redirectUri: string): boolean {
  try {
    return new URL(url).protocol === new URL(redirectUri).protocol;
  } catch {
    return false;
  }
}
