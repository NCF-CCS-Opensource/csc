export type Role = "student" | "officer" | "governor";

// The identity response shape shared by apps/api, apps/web and apps/mobile
// (ADR-0019). A breaking change here is a compile error in every client,
// including the booth app, which is the point of a contracts package.
export interface IdentityResponse {
  studentId: string;
  authUserId: string;
  email: string;
  name: string;
  role: Role;
  program: string;
}
