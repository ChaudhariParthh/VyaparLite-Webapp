import { describe, expect, it } from "vitest";
import { CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR, categoryInUseError } from "@/lib/categories";

describe("category rules", () => {
  it("blocks deleting a category that has entries, with a clear reason", () => {
    expect(categoryInUseError(1)).toMatch(/1 entry still uses this category/);
    expect(categoryInUseError(5)).toMatch(/5 entries still use this category/);
  });
  it("allows deleting an unused category", () => {
    expect(categoryInUseError(0)).toBeNull();
  });
  it("every entry type has a fallback colour in the preset palette", () => {
    expect(CATEGORY_COLORS).toContain(DEFAULT_CATEGORY_COLOR.income);
    expect(CATEGORY_COLORS).toContain(DEFAULT_CATEGORY_COLOR.expense);
  });
});
