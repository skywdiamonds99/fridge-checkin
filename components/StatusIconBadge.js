const COLORS = {
  red: { bg: "var(--color-red-bg)", fg: "var(--color-red)" },
  yellow: { bg: "var(--color-yellow-bg)", fg: "#706500" },
  green: { bg: "var(--color-green-bg)", fg: "#ffffff" },
  expired: { bg: "var(--color-expired-bg)", fg: "var(--color-expired)" },
};

// 목록/미리보기에서 품목 아이콘 자리에 쓰는 상태색 배지 (냉장/냉동/실온을 구분하는 실제 아이콘 체계는
// 이번 범위 밖이라, 소비기한 상태 색으로 대신 표시한다).
export default function StatusIconBadge({ status, size = 48 }) {
  const color = COLORS[status] || COLORS.expired;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: color.bg }}
    >
      <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="none" stroke={color.fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="M3.3 7 12 12l8.7-5" />
        <path d="M12 22V12" />
      </svg>
    </div>
  );
}
