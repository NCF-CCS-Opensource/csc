import type { DynamicModule, INestApplication, Provider, Type } from "@nestjs/common";
import { Test } from "@nestjs/testing";

export async function createTestApp(
  controllers: Type<unknown>[],
  providers: Provider[],
  imports: (Type<unknown> | DynamicModule)[] = [],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports, controllers, providers }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
