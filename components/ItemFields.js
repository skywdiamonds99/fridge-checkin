const STORAGE_OPTIONS = ["냉장", "냉동", "실온"];

// 품목명/수량/보관구분/보관일수 입력 UI. ItemForm(직접 추가)과
// ReceiptConfirmCard(영수증 확인)가 함께 쓴다.
export default function ItemFields({
  name,
  onNameChange,
  quantity,
  onQuantityChange,
  storageType,
  onStorageChange,
  manualDays,
  onManualDaysChange,
  match,
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
        품목명
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="예: 서울우유 1L"
          className="min-h-[44px] rounded-md px-3 text-sm"
          style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-primary)" }}
        />
      </label>

      <div className="flex h-[44px] items-center justify-between">
        <div className="flex h-full items-center rounded-lg p-1" style={{ backgroundColor: "var(--color-surface-muted)" }}>
          {STORAGE_OPTIONS.map((option) => {
            const active = storageType === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onStorageChange(option)}
                className="min-h-[36px] rounded-md px-3 text-sm"
                style={{
                  backgroundColor: active ? "var(--color-brand)" : "transparent",
                  color: active ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex h-full items-center rounded-lg" style={{ backgroundColor: "var(--color-surface-alt)" }}>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="flex h-full w-9 items-center justify-center text-sm"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="수량 줄이기"
          >
            −
          </button>
          <span className="min-w-[24px] text-center text-sm" style={{ color: "var(--color-text-primary)" }}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(quantity + 1)}
            className="flex h-full w-9 items-center justify-center text-sm"
            style={{ color: "var(--color-text-secondary)" }}
            aria-label="수량 늘리기"
          >
            +
          </button>
        </div>
      </div>

      {match.matched ? (
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          소비기한: 자동 계산됨 ({match.days}일 기준)
        </p>
      ) : (
        <label className="flex flex-col gap-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          보관 일수 (기준표에 없어 직접 입력)
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={manualDays}
            onChange={(e) => onManualDaysChange(e.target.value)}
            placeholder="예: 7"
            className="min-h-[44px] rounded-md px-3 text-sm"
            style={{ backgroundColor: "var(--color-surface-alt)", color: "var(--color-text-primary)" }}
          />
        </label>
      )}
    </div>
  );
}
