"use client";

import { useEffect, useMemo, useState } from "react";
import { lookupReferenceItem } from "@/lib/referenceTable";
import ItemFields from "./ItemFields";

// 영수증 확인 화면의 카드 1개. 개별 확인 버튼이 없고, 값이 바뀔 때마다
// 부모에게 현재 상태를 보고한다 — 부모의 "확인하고 추가하기" 버튼이 전체를 한 번에 저장한다.
export default function ReceiptConfirmCard({ item, onChange, onDiscard }) {
  const [name, setName] = useState(item.reason === "unreadable" ? "" : item.rawName);
  const [quantity, setQuantity] = useState(item.quantity || 1);
  const [storageType, setStorageType] = useState("냉장");
  const [manualDays, setManualDays] = useState("");

  const match = useMemo(() => lookupReferenceItem(name, storageType), [name, storageType]);
  const manualDaysNumber = Number(manualDays);
  const hasValidManualDays = manualDays.trim() !== "" && Number.isFinite(manualDaysNumber) && manualDaysNumber > 0;
  const effectiveDays = match.matched ? match.days : hasValidManualDays ? manualDaysNumber : null;
  const ready = Boolean(name.trim()) && effectiveDays != null;

  useEffect(() => {
    onChange(item.key, ready ? { name: name.trim(), quantity, storageType, days: effectiveDays } : null);
    // item.key와 onChange는 부모에서 안정적으로 넘어오므로 의존성에서 뺀다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, quantity, storageType, effectiveDays, ready]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: ready ? "var(--color-brand)" : "var(--color-surface-muted)" }}
        aria-hidden
      />
      <div className="mb-3 flex items-start justify-between gap-2 pl-1">
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {item.reason === "unreadable" ? '인식된 이름: "??? (읽지 못한 줄)"' : `인식된 이름: "${item.rawName}"`}
        </p>
        <button
          type="button"
          onClick={() => onDiscard(item.key)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
          style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text-secondary)" }}
          aria-label="이 품목 제외하기"
        >
          ✕
        </button>
      </div>
      <div className="pl-1">
        <ItemFields
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
