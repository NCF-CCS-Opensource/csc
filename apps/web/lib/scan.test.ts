import { describe, expect, it } from "vitest";
import { decodeQrPayload, isSessionAbsent, modeToHalfAndField } from "./scan";

describe("modeToHalfAndField", () => {
  it("maps time_in_am", () => {
    expect(modeToHalfAndField("time_in_am")).toEqual({ half: "am", field: "timeIn" });
  });

  it("maps time_out_am", () => {
    expect(modeToHalfAndField("time_out_am")).toEqual({ half: "am", field: "timeOut" });
  });

  it("maps time_in_pm", () => {
    expect(modeToHalfAndField("time_in_pm")).toEqual({ half: "pm", field: "timeIn" });
  });

  it("maps time_out_pm", () => {
    expect(modeToHalfAndField("time_out_pm")).toEqual({ half: "pm", field: "timeOut" });
  });
});

describe("decodeQrPayload", () => {
  it("decodes a well-formed payload", () => {
    const raw = JSON.stringify({
      name: "Juan Dela Cruz",
      studentId: "2021-00123",
      program: "Computer Science",
    });
    expect(decodeQrPayload(raw)).toEqual({
      name: "Juan Dela Cruz",
      studentId: "2021-00123",
      program: "Computer Science",
    });
  });

  it("returns null for invalid JSON", () => {
    expect(decodeQrPayload("not json")).toBeNull();
  });

  it("returns null when a required field is missing", () => {
    expect(decodeQrPayload(JSON.stringify({ name: "Juan" }))).toBeNull();
  });

  it("returns null when a field has the wrong type", () => {
    expect(
      decodeQrPayload(JSON.stringify({ name: "Juan", studentId: 123, program: "CS" })),
    ).toBeNull();
  });
});

describe("isSessionAbsent", () => {
  it("is present when both timeIn and timeOut are set", () => {
    expect(isSessionAbsent({ timeIn: new Date(), timeOut: new Date() })).toBe(false);
  });

  it("is absent when timeIn is missing", () => {
    expect(isSessionAbsent({ timeIn: null, timeOut: new Date() })).toBe(true);
  });

  it("is absent when timeOut is missing", () => {
    expect(isSessionAbsent({ timeIn: new Date(), timeOut: null })).toBe(true);
  });

  it("is absent when both are missing", () => {
    expect(isSessionAbsent({ timeIn: null, timeOut: null })).toBe(true);
  });
});
