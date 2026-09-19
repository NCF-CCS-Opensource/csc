import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Actor } from "../domain/actor";

export const CallerActor = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Actor => {
    return ctx.switchToHttp().getRequest().actor;
  },
);
