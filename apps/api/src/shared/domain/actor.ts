import type { Role } from "./role";

// The caller, resolved from a verified identity token. Never constructed
// from a caller's own claim about who they are (ADR-0019).
export interface Actor {
  id: string;
  studentId: string;
  authUserId: string;
  email: string;
  name: string;
  role: Role;
  program: string;
}
