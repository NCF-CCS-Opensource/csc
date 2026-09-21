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
  if (process.env.NODE_ENV !== "production") app.useGlobalFilters(new DevErrorLoggerFilter());
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
