import {
  dynamicFormatFromConfig,
  mutableChainWorkflow,
  timezoneFromUser
} from "../src/lib/hard";

describe("hard moment usage", () => {
  it("falls back to local zone when user tz missing", () => {
    const value = timezoneFromUser("2026-05-03T15:45:00Z", null);
    expect(value).toContain("2026-05-03");
  });

  it("handles explicit user timezone", () => {
    const value = timezoneFromUser("2026-05-03T15:45:00Z", "America/New_York");
    expect(value).toContain("2026-05-03");
  });

  it("retains mutable chain behavior", () => {
    expect(mutableChainWorkflow("2026-05-03T00:00:00Z")).toEqual({
      first: "2026-05-04",
      second: "2026-05-06"
    });
  });

  it("supports dynamic format strings", () => {
    expect(dynamicFormatFromConfig("2026-05-03T15:45:00Z", "YYYY/MM/DD HH:mm")).toBe("2026/05/03 15:45");
  });
});
