import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiFetch }));

import { getMyLedger } from "./student-ledger";
import { studentLedgerQueryKey } from "./student-ledger.query-key";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMyLedger", () => {
  it("reads the signed-in Student's own Ledger for a Semester", async () => {
    const ledger = { total: 150, outstanding: 50, sessions: [] };
    apiFetch.mockResolvedValueOnce(ledger);

    const result = await getMyLedger("sem-1");

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/ledger/mine", { semesterId: "sem-1" });
    expect(result).toEqual(ledger);
  });
});

describe("studentLedgerQueryKey", () => {
  it("is a stable key, scoped by Semester", () => {
    expect(studentLedgerQueryKey("sem-1")).toEqual(["student-ledger", "sem-1"]);
  });
});
