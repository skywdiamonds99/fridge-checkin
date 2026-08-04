import StatusIconBadge from "./StatusIconBadge";

const STATUS_STYLES = {
  red: { text: "var(--color-red)", bar: "var(--color-red)" },
  yellow: { text: "#a68b00", bar: "var(--color-yellow-bg)" },
  green: { text: "var(--color-green)", bar: "var(--color-green-bg)" },
  expired: { text: "var(--color-expired)", bar: "var(--color-expired-bg)" },
};

export default function ItemCard({ item, onDecrease, onDelete, showStorageBadge = false }) {
  const style = STATUS_STYLES[item.status];
  const remainingLabel =
    item.status === "expired" ? `D+${Math.abs(item.remaining)}` : `D-${item.remaining}`;

  return (
    <li className="relative overflow-hidden rounded-lg bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ backgroundColor: style.bar }} aria-hidden />
      <div className="flex items-center gap-3 pl-1">
        <StatusIconBadge status={item.status} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {item.name}
            </span>
            {showStorageBadge && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px]"
                style={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-secondary)" }}
              >
                {item.storageType}
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            수량 {item.quantity}
          </span>
        </div>
        <span className="shrink-0 text-sm font-semibold" style={{ color: style.text }}>
          {remainingLabel}
        </span>
      </div>

      <div className="mt-2 ml-1 h-1.5 w-[calc(100%-4px)] overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-surface-muted)" }}>
        <div className="h-full rounded-full" style={{ width: `${item.percent}%`, backgroundColor: style.bar }} />
      </div>

      <div className="mt-2 ml-1 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => onDecrease(item.id)}
          className="min-h-[44px] min-w-[44px] rounded-md border text-sm"
          style={{ borderColor: "var(--color-surface-muted)", color: "var(--color-text-secondary)" }}
          aria-label="수량 1개 줄이기"
        >
          -1
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="min-h-[44px] min-w-[44px] rounded-md border text-sm"
          style={{ borderColor: "var(--color-surface-muted)", color: "var(--color-text-secondary)" }}
          aria-label="삭제"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
