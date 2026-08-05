"use client";

import { useState } from "react";
import { statusBadgeLabel } from "@/lib/expiry";

const BADGE_STYLES = {
  expired: { bg: "var(--color-expired-bg)", text: "var(--color-text-secondary)" },
  red: { bg: "var(--color-red-bg)", text: "var(--color-red)" },
  yellow: { bg: "var(--color-yellow-bg)", text: "#706500" },
  green: { bg: "var(--color-brand-light)", text: "var(--color-brand-selected-text)" },
};

const BAR_FILL = {
  red: "var(--color-red)",
  yellow: "var(--color-yellow-bg)",
  green: "var(--color-green-bg)",
};

const DAY_TEXT_COLOR = {
  red: "var(--color-red)",
  yellow: "#a68b00",
  green: "var(--color-green)",
};

// 수량 조절은 "체크아웃"을 눌러야 나온다 — 평소엔 개수만 보여준다.
export default function BrowseItemCard({ item, onDecrease, onDelete }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const expired = item.status === "expired";
  const badge = BADGE_STYLES[item.status];

  return (
    <li
      className="relative flex overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
      style={{ opacity: expired ? 0.6 : 1 }}
    >
      <span
        className="w-1 shrink-0"
        style={{ backgroundColor: expired ? "var(--color-expired-bg)" : BAR_FILL[item.status] }}
        aria-hidden
      />
      <div className="flex-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <span className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {item.name}
          </span>
          <span
            className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: badge.bg, color: badge.text }}
          >
            {statusBadgeLabel(item.status, item.remaining)}
          </span>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {item.storageType}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          {!expired ? (
            <div className="flex flex-1 items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-expired-bg)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.percent}%`, backgroundColor: BAR_FILL[item.status] }}
                />
              </div>
              <span className="text-xs font-semibold" style={{ color: DAY_TEXT_COLOR[item.status] }}>
                {item.remaining === 0 ? "D-DAY" : `${item.remaining}일 남음`}
              </span>
            </div>
          ) : (
            <span />
          )}

          {!checkoutOpen ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                {item.quantity}개
              </span>
              <button
                type="button"
                onClick={() => setCheckoutOpen(true)}
                className="min-h-[28px] rounded px-2 text-xs"
                style={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
              >
                체크아웃
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onDecrease(item.id)}
                className="flex h-7 w-7 items-center justify-center rounded"
                style={{ backgroundColor: "var(--color-surface-muted)" }}
                aria-label="수량 줄이기"
              >
                −
              </button>
              <span className="w-5 text-center text-sm">{item.quantity}</span>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="ml-1 rounded px-2 py-1 text-xs"
                style={{ backgroundColor: "var(--color-red-bg)", color: "var(--color-red)" }}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
