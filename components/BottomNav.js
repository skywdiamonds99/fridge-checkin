"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// public/icons/*.svg는 Figma에서 그대로 받아온 아이콘 (get_design_context로 내려받음)
const TABS = [
  { href: "/", label: "홈", icon: "nav-home" },
  { href: "/browse", label: "냉장고 둘러보기", icon: "nav-browse" },
  { href: "/receipt", label: "체크인", icon: "nav-checkin" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-16 shrink-0 items-center justify-center border-t border-black/5 px-1"
      style={{ backgroundColor: "rgba(248,249,250,0.9)" }}
    >
      {TABS.map(({ href, label, icon }) => {
        const active = pathname === href;
        const color = active ? "var(--color-brand)" : "var(--color-text-secondary)";
        return (
          <Link key={href} href={href} className="flex h-full flex-1 flex-col items-center justify-center gap-1">
            <Image
              src={`/icons/${icon}-${active ? "active" : "inactive"}.svg`}
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-auto"
            />
            <span className="text-xs font-medium" style={{ color }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
