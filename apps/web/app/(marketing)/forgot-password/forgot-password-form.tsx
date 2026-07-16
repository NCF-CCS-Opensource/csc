"use client";

import { KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <Mail className="size-7" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground max-w-xs text-sm">
            If that email is registered, we sent a password reset link to it.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <KeyRound className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          Enter your school email and we&apos;ll send you a link to set a new password.
        </p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-sm">
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">School email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="juan.delacruz@gbox.ncf.edu.ph"
                required
              />
            </div>
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            <Link href="/login" className="text-primary underline underline-offset-2">
              Back to log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
