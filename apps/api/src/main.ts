import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Versioned RPC-style prefix (ADR-0017): the booth app ships as an
// installed binary that cannot be redeployed in lockstep with the API.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1/api");
  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
