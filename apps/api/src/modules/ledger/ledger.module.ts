import { Module } from "@nestjs/common";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";
import { LedgerUseCase } from "./application/ledger.use-case";
import { LedgerController } from "./presentation/ledger.controller";
@Module({ controllers: [LedgerController], providers: [LedgerUseCase, AuthGuard, CapabilityGuard] })
export class LedgerModule {}
