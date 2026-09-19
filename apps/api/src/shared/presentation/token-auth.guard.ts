import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { TOKEN_VERIFIER, type TokenVerifier } from "../domain/token-verifier";

function extractBearerToken(authorization: string | undefined): string {
  return (authorization ?? "").replace(/^Bearer\s+/i, "");
}

// Token-only authentication, unlike AuthGuard: a caller reaching for Roster
// Claim has no Student row yet (they're Pending), so requiring one here
// would make the claim route unreachable by the caller it exists for
// (ADR-0019). Attaches request.authUserId, never a resolved Actor.
@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_VERIFIER) private readonly tokenVerifier: TokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractBearerToken(request.headers.authorization);
    const verified = token ? await this.tokenVerifier.verify(token) : null;

    if (!verified) {
      throw new UnauthorizedException("Authentication required");
    }

    request.authUserId = verified.authUserId;
    return true;
  }
}
