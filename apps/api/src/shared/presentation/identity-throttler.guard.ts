import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

// M-3 (validation finding): every request reaches this API server-to-server
// (apps/web's BFF, or the mobile relay), so the raw IP the base ThrottlerGuard
// keys on is always the platform's egress/router address, never the end
// user's — making the "per-caller" limit actually org-wide. Key on the
// caller's own identity instead: AuthGuard/TokenAuthGuard (which always run
// before this guard per @UseGuards ordering) attach one of these before this
// runs. Fall back to req.ip only for a route with neither (shouldn't happen
// on a guarded controller, but keeps this guard safe to reuse elsewhere).
@Injectable()
export class IdentityThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const actor = req.actor as { id?: string } | undefined;
    if (actor?.id) return actor.id;
    if (typeof req.authUserId === "string") return req.authUserId;
    return super.getTracker(req);
  }
}
