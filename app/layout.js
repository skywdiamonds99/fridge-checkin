import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "냉장고 체크인",
  description: "영수증 사진 한 장으로 냉장고 속 식료품과 남은 소비기한을 자동으로 관리해주는 앱",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 모바일 세로 화면 전용, 기준 폭 390px (PRD 5장·DESIGN.md 기술 선택) */}
        <div
          className="mx-auto flex h-screen w-full max-w-[390px] flex-col shadow-sm"
          style={{ backgroundColor: "var(--color-bg)" }}
        >
          <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
