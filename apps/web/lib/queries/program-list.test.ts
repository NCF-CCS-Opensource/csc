import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiPost } = vi.hoisted(() => ({ apiPost: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiPost }));

import { getProgramList } from "./program-list";
import { programListQueryKey } from "./program-list.query-key";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getProgramList", () => {
  it("reads the detailed Program list from the API", async () => {
    const response = { programs: [{ id: "p1", name: "BS Computer Science" }] };
    apiPost.mockResolvedValueOnce(response);

    const result = await getProgramList();

    expect(apiPost).toHaveBeenCalledWith("program/list-detailed");
    expect(result).toEqual(response);
  });
});

describe("programListQueryKey", () => {
  it("is a stable key", () => {
    expect(programListQueryKey).toEqual(["program-list"]);
  });
});
