"use server";

import { getCurrentStudent, type Identity } from "@/lib/auth";

// The signed-in caller's own identity, for every gated page's layout shell
// (issue #285). Wraps the same `getCurrentStudent()` every page's
// `requireCapability` gate already calls — React's `cache()` on that function
// dedupes it to one upstream fetch per request, so the shell and the page's
// authorization check share one resolution instead of two. Usable directly
// for the SSR + initialData pattern, and as a client `queryFn` alongside
// identityQueryKey (ADR 0013).
export async function getIdentity(): Promise<Identity | null> {
  const student = await getCurrentStudent();
  if (!student) return null;
  const { name, email, role } = student;
  return { name, email, role };
}
