import { describe, expect, it } from "vitest";
import { currentMonthRange, isValidAmount, monthlySeries, summarize, toCSV, todayIST } from "@/lib/finance";

describe("finance rules", () => {
  it("net cash flow = income minus expenses without float drift", () => {
    const s = summarize([
      { type: "income", amount: "0.10", transaction_date: "2026-01-01" },
      { type: "income", amount: "0.20", transaction_date: "2026-01-02" },
      { type: "expense", amount: "0.05", transaction_date: "2026-01-02" },
    ]);
    expect(s.income).toBe(0.3);
    expect(s.expense).toBe(0.05);
    expect(s.net).toBe(0.25);
  });
  it("amount must be positive with at most two decimals", () => {
    expect(isValidAmount("100.25")).toBe(true);
    expect(isValidAmount("100.255")).toBe(false);
    expect(isValidAmount("0")).toBe(false);
    expect(isValidAmount("-5")).toBe(false);
  });
  it("uses Asia/Kolkata for today's date", () => {
    // 2026-03-31 20:00 UTC is already 1 April in India
    expect(todayIST(new Date("2026-03-31T20:00:00Z"))).toBe("2026-04-01");
    expect(currentMonthRange(new Date("2026-03-31T20:00:00Z"))).toEqual({ from: "2026-04-01", to: "2026-04-30" });
  });
  it("monthly series fills empty months", () => {
    const s = monthlySeries([{ type: "income", amount: 50, transaction_date: "2026-03-10" }], "2026-01-01", "2026-03-31");
    expect(s.map((x) => x.income)).toEqual([0, 0, 50]);
  });
  it("CSV escapes formulas", () => {
    expect(toCSV([{ a: "=SUM(A1)" }], ["a"])).toContain(`"'=SUM(A1)"`);
  });
});
