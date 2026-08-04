"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadItems } from "@/lib/storage";
import { computeDashboardStats } from "@/lib/dashboardStats";
import StatusIconBadge from "@/components/StatusIconBadge";

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 5) return "좋은 새벽이에요!";
  if (hour < 12) return "좋은 아침이에요!";
  if (hour < 18) return "좋은 오후예요!";
  return "좋은 저녁이에요!";
}

const STORAGE_SHORTCUTS = ["냉장", "냉동", "실온"];

function remainingLabel(item) {
  if (item.remaining === 0) return "오늘까지";
  return `${item.remaining}일 남음`;
}

const STATUS_TEXT_COLOR = {
  red: "var(--color-red)",
  yellow: "#a68b00",
  green: "var(--color-green)",
};

export default function MainHome() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    setItems(loadItems());
  }, []);

  const stats = items ? computeDashboardStats(items) : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          {getGreeting(new Date())}
        </h1>
        <p className="text-base" style={{ color: "var(--color-text-secondary)" }}>
          체크인 상황을 전해드립니다.
        </p>
      </div>

      <div className="flex gap-2">
        <Link
          href="/receipt"
          className="flex flex-1 flex-col justify-between rounded-xl p-4"
          style={{ backgroundColor: "var(--color-brand-light)", minHeight: 120 }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              영수증 체크인
            </p>
            <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
              영수증을 찍어 냉장고에 저장
            </p>
          </div>
          <svg width="20" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-primary)" strokeWidth="2">
            <path d="M4 4h4l2-2h4l2 2h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
            <circle cx="12" cy="12" r="4" />
          </svg>
        </Link>

        <div className="flex flex-1 flex-col gap-2">
          <div
            className="flex flex-1 items-center justify-between rounded-xl px-4 py-2"
            style={{ backgroundColor: "var(--color-red-bg)" }}
          >
            <div>
              <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
                유통기한 임박
              </p>
              <p className="text-xl font-bold" style={{ color: "var(--color-red)" }}>
                {stats ? stats.urgentCount : "–"}
              </p>
            </div>
            <span aria-hidden style={{ color: "var(--color-red)" }}>
              ⚠
            </span>
          </div>
          <div
            className="flex flex-1 items-center justify-between rounded-xl px-4 py-2"
            style={{ backgroundColor: "var(--color-surface-muted)" }}
          >
            <div>
              <p className="text-[10px]" style={{ color: "var(--color-text-secondary)" }}>
                체크인 현황
              </p>
              <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                {stats ? stats.totalQuantity : "–"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between pt-2">
          <h2 className="text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
            냉장고 파먹기 대기 중
          </h2>
          <Link href="/browse" className="text-sm" style={{ color: "var(--color-brand-selected-text)" }}>
            전체 보기
          </Link>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          {stats && stats.topExpiring.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">임박한 품목이 없습니다.</p>
          )}
          {stats &&
            stats.topExpiring.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center gap-4 overflow-hidden rounded-lg bg-white py-2 pl-2 pr-4 shadow-sm"
              >
                <span
                  className="absolute left-0 top-0 h-full w-[2px]"
                  style={{ backgroundColor: STATUS_TEXT_COLOR[item.status] }}
                  aria-hidden
                />
                <StatusIconBadge status={item.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {item.quantity}개
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold" style={{ color: STATUS_TEXT_COLOR[item.status] }}>
                  {remainingLabel(item)}
                </p>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h2 className="pt-2 text-xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
          보관 위치 분류
        </h2>
        <div className="mt-2 flex gap-4">
          {STORAGE_SHORTCUTS.map((type) => (
            <Link key={type} href={`/browse?filter=${encodeURIComponent(type)}`} className="flex flex-col items-center gap-2">
              <div
                className="flex size-16 items-center justify-center rounded-full shadow-sm"
                style={{ backgroundColor: "var(--color-surface-muted)" }}
              >
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {type}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
