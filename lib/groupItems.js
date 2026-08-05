import { remainingDays, expiryStatus, barPercent } from "./expiry.js";

// 소비기한 만료 품목이 항상 맨 위, 그 아래는 임박한 순서로 — 보관 구분 구분 없이 하나의 평면 목록.
// remaining이 작을수록(더 많이 지났거나 더 임박할수록) 앞에 오므로 오름차순 정렬 하나로 충분하다.
export function sortItemsByUrgency(items, now = new Date()) {
  const enriched = items.map((item) => {
    const remaining = remainingDays(item.expiryDate, now);
    return {
      ...item,
      remaining,
      status: expiryStatus(remaining),
      percent: barPercent(remaining),
    };
  });

  return enriched.sort((a, b) => a.remaining - b.remaining);
}
