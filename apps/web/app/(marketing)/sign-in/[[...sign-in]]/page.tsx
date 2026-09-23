"use client";

import { useSignIn } from "@clerk/nextjs";
import { useEffect } from "react";

// One route for both first-time and returning people (ADR-0012): Clerk's
// component works out which is happening, so there is no separate register
// page. Google is the only enabled strategy (Clerk Dashboard), so this skips
// straight to the OAuth redirect instead of showing a "Continue with
// Google" button to click through.
export default function SignInPage() {
  const { signIn } = useSignIn();

  useEffect(() => {
    signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: "/sso-callback",
      redirectUrl: "/dashboard",
    });
  }, [signIn]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Redirecting to your school Google account…
        </p>
      </div>
    </main>
  );
}
