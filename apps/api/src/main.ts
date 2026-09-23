import "reflect-metadata";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Request, Response, NextFunction } from "express";
import { AppModule } from "./app.module";

// Dev-only: prints the full stack for anything that isn't a handled
// HttpException, so a 500 in the browser has a trace in this terminal.
@Catch()
class DevErrorLoggerFilter implements ExceptionFilter {
  private readonly logger = new Logger("UnhandledException");

  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest();
    const response = host.switchToHttp().getResponse();
    const isHttpException = exception instanceof HttpException;

    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException ? exception.getResponse() : { statusCode: status, message: "Internal server error" };

    if (isHttpException) {
      this.logger.error(`${request.method} ${request.url} ${status} body=${JSON.stringify(request.body)} -> ${JSON.stringify(body)}`);
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(body);
  }
}

// Versioned RPC-style prefix (ADR-0017): the booth app ships as an
// installed binary that cannot be redeployed in lockstep with the API.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1/api");

  // Request/response logging. Caller id is read after the handler runs
  // (AuthGuard/TokenAuthGuard set request.actor/authUserId during it) so
  // every 401/403/429 rejection is attributable, not just successes —
  // otherwise this is the only durable record of who touched what
  // (compliance finding: OWASP ASVS 7.1.3 / RA 10173 access logging).
  app.use((req: Request, res: Response, next: NextFunction) => {
    const logger = new Logger("HTTP");
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      const actor = (req as { actor?: { id?: string } }).actor;
      const caller = actor?.id ?? (req as { authUserId?: string }).authUserId ?? "anon";
      logger.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms caller=${caller}`);
    });
    res.on("error", (err: Error) => {
      const logger = new Logger("HTTPError");
      logger.error(`${req.method} ${req.url}: ${err.message}`, err.stack);
    });
    next();
  });

  // Opt-in, not opt-out: only the explicit local-dev value gets the
  // stack-trace-leaking filter, so an unset/staging/test NODE_ENV never
  // does (L-9 — !== "production" would have let it through by accident).
  if (process.env.NODE_ENV === "development") app.useGlobalFilters(new DevErrorLoggerFilter());
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  const host = "0.0.0.0";
  await app.listen(port, host);
  const logger = new Logger("Bootstrap");
  logger.log(`Listening on ${host}:${port}`);
}

bootstrap();
