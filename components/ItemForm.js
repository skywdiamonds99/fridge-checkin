"use client";

import { useMemo, useState } from "react";
import { lookupReferenceItem } from "@/lib/referenceTable";
import ItemFields from "./ItemFields";

// 직접 추가 화면에서 쓰는 입력 폼. 기준표에 매칭되면 소비기한을 자동 계산하고,
// 매칭되지 않으면 사람이 보관 일수를 직접 입력해야 등록할 수 있다.
export default function ItemForm({ initialName = "", initialQuantity = 1, submitLabel = "확인", onSubmit }) {
  const [name, setName] = useState(initialName);
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [storageType, setStorageType] = useState("냉장");
  const [manualDays, setManualDays] = useState("");

  const match = useMemo(() => lookupReferenceItem(name, storageType), [name, storageType]);
  const manualDaysNumber = Number(manualDays);
  const hasValidManualDays = manualDays.trim() !== "" && Number.isFinite(manualDaysNumber) && manualDaysNumber > 0;
  const effectiveDays = match.matched ? match.days : hasValidManualDays ? manualDaysNumber : null;
  const canSubmit = Boolean(name.trim()) && effectiveDays != null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), quantity, storageType, days: effectiveDays });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-[44px] rounded-lg text-sm font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: "var(--color-brand)" }}
      >
        {submitLabel}
      </button>
    </form>
  );
}
