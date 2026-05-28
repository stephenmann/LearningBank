import { describe, expect, it } from "vitest";
import { formatCurrencyValue } from "@/lib/user-preferences";

describe("formatCurrencyValue", () => {
  it("formats euro with comma decimals and period thousands", () => {
    expect(formatCurrencyValue(1234567.89, "EUR")).toMatch(/1[.]234[.]567,89/);
  });

  it("formats yen without decimal places", () => {
    const formatted = formatCurrencyValue(1234.56, "JPY");
    expect(formatted).toMatch(/1[,.]?235/);
    expect(formatted).not.toMatch(/[.,]\d{2}\b/);
  });

  it("formats rupees with Indian digit grouping", () => {
    expect(formatCurrencyValue(1234567.89, "INR")).toMatch(/12[, ]?34[, ]?567\.89/);
  });

  it.each([
    ["USD", /1,234\.56/],
    ["GBP", /1,234\.56/],
    ["CAD", /1,234\.56/],
    ["AUD", /1,234\.56/],
    ["CNY", /1,234\.56/],
    ["MXN", /1,234\.56/],
    ["CHF", /1[’']?234\.56/],
  ] as const)("formats %s with the expected western-style separators", (currency, pattern) => {
    expect(formatCurrencyValue(1234.56, currency)).toMatch(pattern);
  });
});
