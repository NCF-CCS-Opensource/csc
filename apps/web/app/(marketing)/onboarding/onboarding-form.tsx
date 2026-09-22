"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { DecorativeAccents } from "@/components/decorative-accents";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claimEnrollmentRoster, type OnboardingState } from "./actions";

const initialState: OnboardingState = { errors: [] };

export function OnboardingForm({ name, email }: { name: string; email: string }) {
  const [state, formAction, pending] = useActionState(claimEnrollmentRoster, initialState);
  const studentIdError = state.errors.find((error) => error.field === "studentId")?.message;
  const emailError = state.errors.find((error) => error.field === "email")?.message;

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
      <DecorativeAccents />
      <AlertDialog open>
        <AlertDialogContent className="rounded-[14px] border-2 border-border shadow-[var(--shadow-lg)]">
          <AlertDialogHeader>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border-2 border-border bg-[var(--color-yellow)] text-foreground">
              <UserPlus className="size-6" aria-hidden />
            </span>
            <AlertDialogTitle className="text-center font-heading text-xl font-bold">
              Confirm your Student ID
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Signed in as {name ? `${name} (${email})` : email}. Enter the Student ID from your
              school record to load your details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {emailError && <p className="text-destructive text-center text-xs">{emailError}</p>}
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studentId" className="text-xs font-bold tracking-[0.08em] uppercase">
                Student ID
              </Label>
              <Input id="studentId" name="studentId" placeholder="24-00136" required />
              {studentIdError && <p className="text-destructive text-xs">{studentIdError}</p>}
            </div>
            <Button type="submit" variant="pill" disabled={pending} size="lg">
              {pending ? "Checking…" : "Claim my roster spot"}
            </Button>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
