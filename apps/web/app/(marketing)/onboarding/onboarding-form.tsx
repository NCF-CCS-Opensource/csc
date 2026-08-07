"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding, type OnboardingState } from "./actions";

const initialState: OnboardingState = { errors: [] };

export function OnboardingForm({
  programs,
  name,
  email,
}: {
  programs: string[];
  name: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const errorFor = (field: string) => state.errors.find((e) => e.field === field)?.message;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <UserPlus className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Finish setting up</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          Signed in as {name ? `${name} (${email})` : email}. Two more things Google can&apos;t
          tell us, then your QR code is on its way.
        </p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="program">Program</Label>
              <select
                id="program"
                name="program"
                required
                className="border-input bg-transparent text-sm rounded-lg border p-2 w-full focus:outline-none focus:ring-2 focus:ring-ring"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a Program
                </option>
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
              {errorFor("program") && (
                <p className="text-destructive text-xs">{errorFor("program")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" name="studentId" placeholder="24-00136" required />
              <p className="text-muted-foreground text-xs">Format: YY-NNNNN, e.g. 24-00136</p>
              {errorFor("studentId") && (
                <p className="text-destructive text-xs">{errorFor("studentId")}</p>
              )}
            </div>
            {(errorFor("email") || errorFor("name")) && (
              <p className="text-destructive text-xs">{errorFor("email") ?? errorFor("name")}</p>
            )}
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Submitting…" : "Finish"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
