import { SignIn } from "@clerk/nextjs";

// One route for both first-time and returning people (ADR-0012): Clerk's
// component works out which is happening, so there is no separate register
// page. Rendered inside the marketing shell, not on a Clerk-hosted page.
export default function SignInPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Use your school Google account.
        </p>
      </div>
      {/* /dashboard sends a Student on to /my-attendance via its own
          capability check, so one landing URL covers every role. */}
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            cardBox: "w-full shadow-sm",
          },
        }}
      />
    </main>
  );
}
