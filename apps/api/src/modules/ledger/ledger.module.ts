import { Module } from "@nestjs/common";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { LEDGER_REPOSITORY } from "./domain/ledger-repository";
import { DrizzleLedgerRepository } from "./infrastructure/drizzle-ledger.repository";
import { LedgerUseCase } from "./application/ledger.use-case";
import { LedgerController } from "./presentation/ledger.controller";
@Module({
  controllers: [LedgerController],
  providers: [
    { provide: LEDGER_REPOSITORY, useClass: DrizzleLedgerRepository },
    LedgerUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class LedgerModule {}
