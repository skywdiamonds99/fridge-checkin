"use client";

import { useEffect, useMemo, useState } from "react";
import { lookupReferenceItem } from "@/lib/referenceTable";
import ItemFields from "./ItemFields";

// 스캔된 품목 1개. 자동 매칭된 품목은 압축 상태(이름 고정 텍스트 + 수정하기)로 시작하고,
// 매칭 안 된 품목은 펼친 상태(입력창 + 취소 + 수정하기)로 시작한다.
// "취소"는 되돌리기가 아니라 이 품목을 이번 체크인에서 아예 빼는 버튼이다.
export default function ReceiptConfirmCard({ item, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(item.expanded);
  const [name, setName] = useState(item.initialName);
  const [quantity, setQuantity] = useState(item.quantity);
  const [storageType, setStorageType] = useState(item.initialStorage);
  const [manualDays, setManualDays] = useState("");

  const match = useMemo(() => lookupReferenceItem(name, storageType), [name, storageType]);
  const manualDaysNumber = Number(manualDays);
  const hasValidManualDays = manualDays.trim() !== "" && Number.isFinite(manualDaysNumber) && manualDaysNumber > 0;
  const effectiveDays = match.matched ? match.days : hasValidManualDays ? manualDaysNumber : null;
  const ready = Boolean(name.trim()) && effectiveDays != null;

  useEffect(() => {
    onChange(item.key, ready ? { name: name.trim(), quantity, storageType, days: effectiveDays } : null);
    // item.key/onChange는 부모에서 안정적으로 내려오므로 의존성에서 뺀다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, quantity, storageType, effectiveDays, ready]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: ready ? "var(--color-brand)" : "var(--color-surface-muted)" }}
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2 pl-1">
        <p className="truncate text-base" style={{ color: "var(--color-text-secondary)" }}>
          {item.headerText}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          {expanded && (
            <button
              type="button"
              onClick={() => onRemove(item.key)}
              className="text-xs"
              style={{ color: "var(--color-text-primary)" }}
            >
              취소
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs"
            style={{ color: "var(--color-text-primary)" }}
          >
            수정하기
          </button>
        </div>
      </div>

      <div className="mt-3 pl-1">
        <ItemFields
          showName={expanded}
          name={name}
          onNameChange={setName}
          quantity={quantity}
          onQuantityChange={setQuantity}
          storageType={storageType}
          onStorageChange={setStorageType}
          manualDays={manualDays}
          onManualDaysChange={setManualDays}
          match={match}
        />
      </div>
    </div>
  );
}
