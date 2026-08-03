"use client";

import { Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerStudent, type RegisterState } from "./actions";

const initialState: RegisterState = { errors: [] };

export function RegisterForm({ programs }: { programs: string[] }) {
  const [state, formAction, pending] = useActionState(registerStudent, initialState);

  if (state.success) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <span className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full">
          <Mail className="size-7" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground max-w-xs text-sm">
            We sent a confirmation link to your school email. Click it to activate your account,
            then log in with your password.
          </p>
        </div>
      </main>
    );
  }

  const errorFor = (field: string) => state.errors.find((e) => e.field === field)?.message;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="space-y-1.5 text-center">
        <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <UserPlus className="size-6" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">Register</h1>
        <p className="text-muted-foreground mx-auto max-w-sm text-sm">
          Sign up with your school email and a password. You&apos;ll confirm your email before you can
          log in.
        </p>
      </div>

      <Card className="w-full max-w-sm border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Your details</CardTitle>
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
              {errorFor("email") && <p className="text-destructive text-xs">{errorFor("email")}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" placeholder="Juan Dela Cruz" required />
              {errorFor("name") && <p className="text-destructive text-xs">{errorFor("name")}</p>}
            </div>
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
              {errorFor("password") && (
                <p className="text-destructive text-xs">{errorFor("password")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
              {errorFor("confirmPassword") && (
                <p className="text-destructive text-xs">{errorFor("confirmPassword")}</p>
              )}
            </div>
            <Button type="submit" disabled={pending} size="lg">
              {pending ? "Submitting…" : "Register"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            Already registered?{" "}
            <Link href="/login" className="text-primary underline underline-offset-2">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
