import {
  compareWindows,
  durationFromMinutes,
  durationFromSeconds,
  quarterLabel,
  reportPeriodLabel,
  rollingRangeLabel,
  scheduleOffset
} from "../src/lib/medium";

describe("medium moment usage", () => {
  it("formats minutes as duration", () => {
    expect(durationFromMinutes(125)).toBe("2h 5m");
  });

  it("formats seconds as duration", () => {
    expect(durationFromSeconds(125)).toBe("2m 5s");
  });

  it("compares windows", () => {
    expect(compareWindows("2026-01-01", "2026-01-02")).toBe("before");
  });

  it("builds rolling range label", () => {
    expect(rollingRangeLabel("2026-05-03")).toContain("-");
  });

  it("computes schedule offset", () => {
    expect(scheduleOffset("2026-05-03T10:00:00Z", 1, 30)).toContain("11:30");
  });

  it("builds quarter labels", () => {
    expect(quarterLabel("2026-05-03")).toBe("Q2 2026");
  });

  it("builds report period labels", () => {
    expect(reportPeriodLabel("2026-05-03")).toContain("->");
  });
});
