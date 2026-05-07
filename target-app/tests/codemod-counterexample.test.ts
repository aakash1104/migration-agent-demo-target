import moment from "moment-timezone";

import { codemodCounterExample } from "../src/lib/codemod-counterexample";

describe("codemodCounterExample", () => {
  const iso = "2026-05-03T15:45:00Z";
  const fmt = "YYYY-MM-DD HH:mm";

  it("formats in America/New_York like moment.tz + add + format", () => {
    const expected = moment
      .tz(iso, "America/New_York")
      .add(90, "minutes")
      .format(fmt);

    expect(expected).toBe("2026-05-03 13:15");
    expect(
      codemodCounterExample({
        sourceIso: iso,
        userTimezone: "America/New_York",
        formatString: fmt
      })
    ).toBe(expected);
  });

  it("uses local zone when userTimezone is null, matching moment().local()", () => {
    const expected = moment(iso).local().add(90, "minutes").format(fmt);

    expect(
      codemodCounterExample({
        sourceIso: iso,
        userTimezone: null,
        formatString: fmt
      })
    ).toBe(expected);
  });
});
