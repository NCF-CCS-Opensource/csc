"use client";

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
      <main className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          We sent a sign-in link to your school email.
        </p>
      </main>
    );
  }

  const errorFor = (field: string) =>
    state.errors.find((e) => e.field === field)?.message;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">School email</Label>
              <Input id="email" name="email" type="email" required />
              {errorFor("email") && (
                <p className="text-destructive text-xs">{errorFor("email")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required />
              {errorFor("name") && (
                <p className="text-destructive text-xs">{errorFor("name")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="program">Program</Label>
              <Select name="program" required>
                <SelectTrigger id="program" className="w-full">
                  <SelectValue placeholder="Select a Program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errorFor("program") && (
                <p className="text-destructive text-xs">{errorFor("program")}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input id="studentId" name="studentId" required />
              {errorFor("studentId") && (
                <p className="text-destructive text-xs">{errorFor("studentId")}</p>
              )}
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
