"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginStudent, resendConfirmation, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginStudent, initialState);
  const [resent, setResent] = useState(false);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <LogIn className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      </div>

      <Card className="w-full max-w-sm border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Your credentials</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.error && <p className="text-destructive text-xs">{state.error}</p>}
            {state.unconfirmedEmail && !resent && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await resendConfirmation(state.unconfirmedEmail!);
                  setResent(true);
                }}
              >
                Resend confirmation email
              </Button>
            )}
            {resent && (
              <p className="text-muted-foreground text-xs">Confirmation email sent — check your inbox.</p>
            )}
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Logging in…" : "Log in"}
            </Button>
          </form>
          <div className="text-muted-foreground mt-4 flex flex-col items-center gap-1.5 text-center text-xs">
            <Link href="/forgot-password" className="text-primary underline underline-offset-2">
              Forgot password?
            </Link>
            <p>
              New here?{" "}
              <Link href="/register" className="text-primary underline underline-offset-2">
                Register
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
