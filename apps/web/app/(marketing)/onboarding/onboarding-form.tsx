"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
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

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
              <UserPlus className="size-6" aria-hidden />
            </span>
            <AlertDialogTitle>Confirm your Student ID</AlertDialogTitle>
            <AlertDialogDescription>
              Signed in as {name ? `${name} (${email})` : email}. Enter the Student ID from your
              school record to load your details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" name="studentId" placeholder="24-00136" required />
              {studentIdError && <p className="text-destructive text-xs">{studentIdError}</p>}
            </div>
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Checking…" : "Continue"}
            </Button>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
