import type { TxnType } from "./finance";

/** Preset swatches offered when picking a category colour. */
export const CATEGORY_COLORS = [
  "#34764f",
  "#5aa06d",
  "#8a9a3f",
  "#c08a2d",
  "#c05a41",
  "#a84a5c",
  "#4a6fa5",
  "#6b6353",
] as const;

/** Fallback colour per entry type, matching the app's income/expense tones. */
export const DEFAULT_CATEGORY_COLOR: Record<TxnType, string> = {
  income: "#34764f",
  expense: "#c05a41",
};

/** A category can only be deleted when no entries reference it. */
export function categoryInUseError(count: number): string | null {
  if (count <= 0) return null;
  return count === 1
    ? "1 entry still uses this category. Archive it instead of deleting."
    : `${count} entries still use this category. Archive it instead of deleting.`;
}
