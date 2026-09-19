import { HttpException } from "@nestjs/common";
import { DomainLifecycleError } from "../domain/lifecycle-error";

// Shared by every single-action controller that calls a use case which can
// fail with a domain lifecycle error (Semester/Event). Converts it to the
// HTTP status the error already carries; anything else is a real bug and
// propagates to Nest's default 500 handling.
export async function runLifecycle<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DomainLifecycleError) {
      throw new HttpException(error.message, error.status);
    }
    throw error;
  }
}
