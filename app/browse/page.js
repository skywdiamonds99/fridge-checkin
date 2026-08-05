"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadItems, decreaseQuantity, deleteItem } from "@/lib/storage";
import { sortItemsByUrgency } from "@/lib/groupItems";
import BrowseItemCard from "@/components/BrowseItemCard";

const FILTERS = ["모두 보기", "냉장", "냉동", "실온"];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");
  const [filter, setFilter] = useState(FILTERS.includes(initialFilter) ? initialFilter : "모두 보기");
  const [items, setItems] = useState(null);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  function handleDecrease(id) {
    setItems(decreaseQuantity(id));
  }
  function handleDelete(id) {
    setItems(deleteItem(id));
  }

  // 소비기한 만료가 항상 맨 위, 그 아래는 임박한 순 — 보관 구분 구분 없이 하나의 목록 (Figma 확정안)
  const sorted = items ? sortItemsByUrgency(items) : null;
  const visible = sorted ? (filter === "모두 보기" ? sorted : sorted.filter((item) => item.storageType === filter)) : null;

  return (
    <>
      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          냉장고 둘러보기
        </h1>
      </div>

      <div
        className="sticky top-0 z-10 flex gap-2 overflow-x-auto px-4 py-4"
        style={{ backgroundColor: "rgba(248,249,250,0.9)" }}
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="min-h-[40px] shrink-0 rounded-full px-4 py-2 text-sm whitespace-nowrap"
              style={{
                backgroundColor: active ? "var(--color-brand-light)" : "var(--color-surface-muted)",
                color: active ? "var(--color-brand-selected-text)" : "var(--color-text-secondary)",
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      <ul className="flex flex-col gap-3 px-4 pb-4">
        {items === null && <p className="p-4 text-center text-sm text-gray-400">불러오는 중…</p>}
        {visible && visible.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-400">아직 등록된 품목이 없습니다.</p>
        )}
        {visible &&
          visible.map((item) => (
            <BrowseItemCard key={item.id} item={item} onDecrease={handleDecrease} onDelete={handleDelete} />
          ))}
      </ul>

      <p className="px-4 pb-4 text-center text-[11px] leading-snug" style={{ color: "var(--color-text-secondary)" }}>
        표시되는 날짜는 추정값입니다 · 앱을 지우거나 기기를 바꾸면 목록이 사라집니다
      </p>
    </>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseContent />
    </Suspense>
  );
}
