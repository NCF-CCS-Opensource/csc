"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server-side detail (stack, digest) is already logged by Next.js before
    // this redacted error reaches the client — this call is browser-console
    // visibility only, not the diagnostic log of record.
    console.error("Root layout render failed:", error);
  }, [error]);

  return (
    // global-error replaces the root layout entirely, so globals.css/Tailwind
    // aren't guaranteed to be loaded here — inline styles keep this boundary
    // rendering even when the layout that would load them is what failed.
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: "24rem" }}>
          <h1 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            We can&apos;t reach the system right now
          </h1>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Attendance can&apos;t connect right now. This is usually temporary
            &mdash; please try again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
