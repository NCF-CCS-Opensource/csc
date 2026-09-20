import type { INestApplication, Provider, Type } from "@nestjs/common";
import { Test } from "@nestjs/testing";

export async function createTestApp(
  controllers: Type<unknown>[],
  providers: Provider[],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ controllers, providers }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
