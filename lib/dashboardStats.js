import { remainingDays, expiryStatus } from "./expiry.js";

// Main Home 대시보드에서 쓰는 통계 — 지난 품목은 제외하고 계산한다.
export function computeDashboardStats(items, now = new Date()) {
  const active = items
    .map((item) => ({ ...item, remaining: remainingDays(item.expiryDate, now) }))
    .filter((item) => item.remaining >= 0);

  const urgentCount = active.filter((item) => expiryStatus(item.remaining) === "red").length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const topExpiring = [...active]
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3)
    .map((item) => ({ ...item, status: expiryStatus(item.remaining) }));

  return { urgentCount, totalQuantity, topExpiring };
}
