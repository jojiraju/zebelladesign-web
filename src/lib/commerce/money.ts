import type { Paise } from "../types";

export const formatINR = (paise: Paise): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);

export const rupeesToPaise = (rupees: number): Paise => Math.round(rupees * 100);

/** Percentage of an amount in paise, rounded half-up to whole paise. */
export const percentOf = (amount: Paise, percent: number): Paise =>
  Math.round((amount * percent) / 100);

export function discountPercent(list: Paise, sale?: Paise | null): number {
  if (!sale || sale >= list || list <= 0) return 0;
  return Math.round(((list - sale) / list) * 100);
}
