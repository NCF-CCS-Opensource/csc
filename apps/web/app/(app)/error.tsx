"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AppError({
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
    console.error("Authenticated app render failed:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>We can&apos;t reach the system right now</CardTitle>
          <CardDescription>
            Attendance can&apos;t connect right now. This is usually temporary
            &mdash; please try again in a moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
