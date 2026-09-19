import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

// Companion to CallerActor for routes guarded by TokenAuthGuard, whose
// caller has no resolved Actor yet (they may still be Pending).
export const CallerAuthUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().authUserId;
  },
);
