import {
  addSettlementDays,
  endOfBusinessDay,
  formatInvoiceDate,
  formatOrderDate,
  formatTimeLabel,
  parseSimpleDate,
  unixToDisplay
} from "../src/lib/trivial";

describe("trivial moment usage", () => {
  it("formats order date", () => {
    expect(formatOrderDate("2026-05-03T15:45:00Z")).toBe("2026-05-03");
  });

  it("formats invoice date", () => {
    expect(formatInvoiceDate("2026-05-03T15:45:00Z")).toBe("May 03, 2026");
  });

  it("computes settlement days", () => {
    expect(addSettlementDays("2026-05-03T00:00:00Z", 5)).toBe("2026-05-08");
  });

  it("uses end of business day helper", () => {
    expect(endOfBusinessDay("2026-05-03T00:00:00Z")).toContain("2026-05-03");
  });

  it("formats clock label", () => {
    expect(formatTimeLabel("2026-05-03T15:45:00Z")).toContain("PM");
  });

  it("parses simple date string", () => {
    expect(parseSimpleDate("05/03/2026")).toBe("2026-05-03");
  });

  it("formats unix timestamps", () => {
    expect(unixToDisplay(1777823100)).toContain("2026");
  });
});
