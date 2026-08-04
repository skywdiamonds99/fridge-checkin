"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function FridgeIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="5" y1="9" x2="19" y2="9" />
      <line x1="8" y1="5" x2="8" y2="7" />
      <line x1="8" y1="12" x2="8" y2="14" />
    </svg>
  );
}

function ScanIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/browse", label: "냉장고 둘러보기", Icon: FridgeIcon },
  { href: "/receipt", label: "체크인", Icon: ScanIcon },
];

// Figma 디자인의 하단 고정 탭바 — 홈 / 냉장고 둘러보기 / 체크인
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-16 shrink-0 items-center justify-center border-t border-black/5 px-1"
      style={{ backgroundColor: "rgba(248,249,250,0.9)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname === href;
        const color = active ? "var(--color-brand)" : "var(--color-text-secondary)";
        return (
          <Link key={href} href={href} className="flex h-full flex-1 flex-col items-center justify-center gap-1">
            <Icon color={color} />
            <span className="text-xs font-medium" style={{ color }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
