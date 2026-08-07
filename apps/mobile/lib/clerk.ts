import { getClerkInstance } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";

// One Clerk instance shared by the React tree (ClerkProvider picks up this
// singleton) and by the plain modules that have no hooks to call — apiFetch and
// the background queue retries in syncScans.
export const clerk = getClerkInstance({
  publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  tokenCache,
});
