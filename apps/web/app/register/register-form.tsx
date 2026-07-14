"use client";

import { useActionState } from "react";
import { registerStudent, type RegisterState } from "./actions";

const initialState: RegisterState = { errors: [] };

export function RegisterForm({ programs }: { programs: string[] }) {
  const [state, formAction, pending] = useActionState(registerStudent, initialState);

  if (state.success) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="text-sm text-zinc-500">
          We sent a sign-in link to your school email.
        </p>
      </main>
    );
  }

  const errorFor = (field: string) =>
    state.errors.find((e) => e.field === field)?.message;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-medium">Register</h1>
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          School email
          <input
            name="email"
            type="email"
            required
            className="rounded border px-2 py-1"
          />
          {errorFor("email") && (
            <span className="text-xs text-red-600">{errorFor("email")}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input name="name" required className="rounded border px-2 py-1" />
          {errorFor("name") && (
            <span className="text-xs text-red-600">{errorFor("name")}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Program
          <select name="program" required className="rounded border px-2 py-1">
            <option value="">Select a Program</option>
            {programs.map((program) => (
              <option key={program} value={program}>
                {program}
              </option>
            ))}
          </select>
          {errorFor("program") && (
            <span className="text-xs text-red-600">{errorFor("program")}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Student ID
          <input name="studentId" required className="rounded border px-2 py-1" />
          {errorFor("studentId") && (
            <span className="text-xs text-red-600">{errorFor("studentId")}</span>
          )}
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Register"}
        </button>
      </form>
    </main>
  );
}
