import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { CapabilityGuard } from "./capability.guard";
import { CAPABILITY_KEY, PUBLIC_KEY } from "./capability.decorator";

function contextWithMetadata(metadata: Record<string, unknown>): {
  context: ExecutionContext;
  reflector: Reflector;
} {
  const reflector = new Reflector();
  reflector.get = ((key: string) => metadata[key]) as Reflector["get"];
  const context = {
    getHandler: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ actor: undefined }) }),
  } as unknown as ExecutionContext;
  return { context, reflector };
}

describe("CapabilityGuard", () => {
  it("denies a route with no @RequireCapability and no @Public", () => {
    const { context, reflector } = contextWithMetadata({});
    const guard = new CapabilityGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("allows a route explicitly marked @Public", () => {
    const { context, reflector } = contextWithMetadata({ [PUBLIC_KEY]: true });
    const guard = new CapabilityGuard(reflector);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("still enforces a declared capability against an unauthenticated actor", () => {
    const { context, reflector } = contextWithMetadata({ [CAPABILITY_KEY]: "administer" });
    const guard = new CapabilityGuard(reflector);
    expect(() => guard.canActivate(context)).toThrow();
  });
});
