import { describe, expect, it } from "vitest";

import { formatCurrency, formatDateTime, normalizeTicketCode } from "./formatters";

describe("formatters", () => {
  it("formats currency with amount and currency code", () => {
    expect(formatCurrency(3, "MXN")).toBe("$3.00 MXN");
  });

  it("normalizes ticket codes by trimming and uppercasing", () => {
    expect(normalizeTicketCode(" a1b2c3d4 ")).toBe("A1B2C3D4");
  });

  it("formats nullable date times for display", () => {
    expect(formatDateTime(null)).toBe("Sin registro");
  });
});
