import { remainingDays, expiryStatus, barPercent } from "./expiry.js";

const STORAGE_TYPES = ["냉장", "냉동", "실온"];

// 지남 칸 → 냉장 → 냉동 → 실온 순, 각 칸 내부는 임박(또는 오래 지난) 순으로 정렬한다 (PRD 4장 93줄).
export function groupAndSortItems(items, now = new Date()) {
  const enriched = items.map((item) => {
    const remaining = remainingDays(item.expiryDate, now);
    return {
      ...item,
      remaining,
      status: expiryStatus(remaining),
      percent: barPercent(remaining),
    };
  });

  const expired = enriched
    .filter((item) => item.remaining < 0)
    .sort((a, b) => a.remaining - b.remaining); // 오래 지난 것부터

  const groups = { expired };
  for (const type of STORAGE_TYPES) {
    groups[type] = enriched
      .filter((item) => item.remaining >= 0 && item.storageType === type)
      .sort((a, b) => a.remaining - b.remaining); // 임박한 것부터
  }

  return groups;
}
