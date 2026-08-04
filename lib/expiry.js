const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// 계산식은 `구매일 + 기준 일수`로 고정한다 (PRD 4장 64줄)
export function computeExpiryDate(purchaseDateTime, days) {
  const purchase = new Date(purchaseDateTime);
  return new Date(startOfDay(purchase).getTime() + days * MS_PER_DAY).toISOString();
}

export function remainingDays(expiryDate, now = new Date()) {
  const diffMs = startOfDay(expiryDate).getTime() - startOfDay(now).getTime();
  return Math.round(diffMs / MS_PER_DAY);
}

// 3일 이하 빨강 / 4~7일 노랑 / 8일 이상 초록 (PRD 4장 87줄)
export function expiryStatus(remaining) {
  if (remaining < 0) return "expired";
  if (remaining <= 3) return "red";
  if (remaining <= 7) return "yellow";
  return "green";
}

// 막대는 14일 기준으로 채우고, 넘으면 꽉 찬 상태로 둔다. 지난 품목은 빈 막대 (PRD 4장 89줄)
export function barPercent(remaining) {
  if (remaining < 0) return 0;
  const capped = Math.min(remaining, 14);
  return Math.round((capped / 14) * 100);
}
