"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

// Lands here after the Google OAuth round trip started in /sign-in.
// Clerk finishes the session here and forwards to redirectUrlComplete.
export default function SSOCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
