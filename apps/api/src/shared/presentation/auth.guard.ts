import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TOKEN_VERIFIER, type TokenVerifier } from "../domain/token-verifier";
import { STUDENT_REPOSITORY } from "../../modules/student/domain/student-repository";
import type { StudentRepository } from "../../modules/student/domain/student-repository";

function extractBearerToken(authorization: string | undefined): string {
  return (authorization ?? "").replace(/^Bearer\s+/i, "");
}

// Authentication only: resolves who the caller is, or refuses identically
// for a missing, expired, tampered or foreign-signed token (ADR-0019).
// Authorization is CapabilityGuard's job, not this guard's.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier,
    @Inject(STUDENT_REPOSITORY) private readonly students: StudentRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers.authorization);
    const verified = token ? await this.tokenVerifier.verify(token) : null;
    const actor = verified ? await this.students.findByAuthUserId(verified.authUserId) : null;

    if (!actor) {
      throw new UnauthorizedException("Authentication required");
    }

    request.actor = actor;
    return true;
  }
}
