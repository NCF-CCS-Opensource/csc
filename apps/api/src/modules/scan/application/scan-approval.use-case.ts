import { Inject, Injectable } from "@nestjs/common";
import type { ScanDecisionRequest, ScannedStudent } from "@attendance/contracts";
import type { Actor } from "../../../shared/domain/actor";
import { DrizzleScanRepository } from "../infrastructure/drizzle-scan.repository";
import type { RejectionReason } from "../domain/scan-rules";

// Application orchestrates the command; transactional SQL stays in its
// infrastructure adapter, alongside the database driver it depends on.
@Injectable()
export class ScanApprovalUseCase {
  constructor(@Inject(DrizzleScanRepository) private readonly scans: DrizzleScanRepository) {}

  identify(actor: Actor, qrPayload: string): Promise<{ student: ScannedStudent }> {
    return this.scans.identify(actor, qrPayload);
  }

  approve(actor: Actor, decision: ScanDecisionRequest) {
    return this.scans.approve(actor, decision);
  }

  reject(actor: Actor, decision: ScanDecisionRequest) {
    return this.scans.reject(actor, decision);
  }

  rejections(actor: Actor): Promise<{ rejections: Array<{
    id: string; eventId: string; eventName: string; scannedAt: string;
    student: ScannedStudent | null; reason: RejectionReason;
  }> }> {
    return this.scans.rejections(actor);
  }
}
