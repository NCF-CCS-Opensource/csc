import { getClerkInstance } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

// One Clerk instance shared by the React tree (ClerkProvider picks up this
// singleton) and by the plain modules that have no hooks to call — apiFetch and
// the background queue retries in syncScans.
export const clerk = getClerkInstance({
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  tokenCache,
});

let hydration: Promise<unknown> | undefined;

// `clerk.user` and `clerk.session` are empty until the instance hydrates, so a
// queue flush fired at launch would otherwise read "nobody is signed in" and
// refuse its own scans. Memoized because `load()` may only be called once.
export function clerkHydrated(): Promise<unknown> {
  hydration ??= clerk.loaded
    ? Promise.resolve()
    : clerk.load().catch(() => undefined);
  return hydration;
}
