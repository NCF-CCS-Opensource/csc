// Base for a module's lifecycle/validation error (e.g. SemesterLifecycleError,
// EventLifecycleError). `status` is the HTTP status runLifecycle() maps it to
// — a domain concept staying framework-free by carrying a plain number rather
// than importing a NestJS HttpException here.
export class DomainLifecycleError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 = 409,
  ) {
    super(message);
  }
}
