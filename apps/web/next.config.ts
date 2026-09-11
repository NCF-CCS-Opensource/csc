import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
      process.env.CLERK_PUBLISHABLE_KEY ||
      "",
    NEXT_PUBLIC_CLERK_SIGN_IN_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in",
    NEXT_PUBLIC_CLERK_SIGN_UP_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up",
  },
  experimental: {
    // Next 16 defaults this to 0, so every client-side nav to a
    // force-dynamic page re-hits the server no matter what the Query cache
    // holds — the client Router Cache, not TanStack Query, is what decides
    // whether a revisit skips the round-trip. 30s matches queryClient's
    // staleTime (query-provider.tsx) so both caches agree on freshness.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
