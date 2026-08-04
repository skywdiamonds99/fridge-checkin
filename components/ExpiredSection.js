"use client";

import { useState } from "react";
import ItemCard from "./ItemCard";

// 지남 칸: 접혀 있어도 개수는 항상 보이고, 남은 품목과 시각적으로 구분되며,
// 원래 보관 구분을 함께 표시한다 (PRD 4장 94~97줄).
export default function ExpiredSection({ items, onDecrease, onDelete }) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <section className="rounded-lg" style={{ backgroundColor: "var(--color-red-bg)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] w-full items-center gap-1 px-4 text-sm font-medium"
        style={{ color: "var(--color-red)" }}
      >
        <span>{open ? "▾" : "▸"}</span>
        <span>지남 {items.length}개</span>
      </button>
      {open && (
        <ul className="flex flex-col gap-2 px-4 pb-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDecrease={onDecrease}
              onDelete={onDelete}
              showStorageBadge
            />
          ))}
        </ul>
      )}
    </section>
  );
}
