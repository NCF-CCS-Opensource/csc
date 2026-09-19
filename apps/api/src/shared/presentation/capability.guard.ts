import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { capabilityFailure, type Capability } from "../domain/role";
import { CAPABILITY_KEY } from "./capability.decorator";
import type { Actor } from "../domain/actor";

// The only place authorization is decided (ADR-0017, ADR-0019). Runs after
// AuthGuard, which has already attached request.actor or thrown 401.
@Injectable()
export class CapabilityGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const capability = this.reflector.get<Capability | undefined>(
      CAPABILITY_KEY,
      context.getHandler(),
    );
    if (!capability) return true;

    const request = context.switchToHttp().getRequest();
    const actor: Actor | undefined = request.actor;
    const denial = capabilityFailure(actor?.role ?? null, capability);

    if (denial === "unauthenticated") {
      throw new UnauthorizedException("Authentication required");
    }
    if (denial === "forbidden") {
      throw new ForbiddenException("Forbidden");
    }
    return true;
  }
}
