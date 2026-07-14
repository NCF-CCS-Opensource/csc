"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <KeyRound className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      </div>

      <Card className="w-full max-w-sm border-none shadow-sm">
        <CardContent className="pt-6">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {state.error && <p className="text-destructive text-xs">{state.error}</p>}
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Saving…" : "Save password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
