import type { NextConfig } from "next";

// Clerk's hosted UI/scripts and Google OAuth are the only third-party
// origins this app talks to from the browser (grep confirmed: no other
// external script/style/font/img hosts; next/font self-hosts Google Fonts
// at build time, so no fonts.googleapis.com/fonts.gstatic.com is needed).
const CLERK_FRONTEND_API = "https://*.clerk.accounts.dev https://*.clerk.com";
const connectSrc = `'self' ${CLERK_FRONTEND_API}`;
// Enforced immediately: safe to lock down without touching Clerk/next-themes.
const enforcedCsp = ["frame-ancestors 'none'", "object-src 'none'"].join(
  "; ",
);
// Report-Only: next-themes injects a small inline bootstrap script (no
// nonce wired up) and Clerk's hosted components load script/style from its
// Frontend API domain — until verified live against the running sign-in
// page, these directives report violations instead of enforcing, so a
// mistake here can't break login.
const reportOnlyCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${CLERK_FRONTEND_API}`,
  `style-src 'self' 'unsafe-inline' ${CLERK_FRONTEND_API}`,
  `img-src 'self' data: https://img.clerk.com`,
  `connect-src ${connectSrc}`,
  `frame-src ${CLERK_FRONTEND_API} https://accounts.google.com`,
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "Content-Security-Policy", value: enforcedCsp },
          {
            key: "Content-Security-Policy-Report-Only",
            value: reportOnlyCsp,
          },
        ],
      },
    ];
  },
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
