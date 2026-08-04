"use client";

import { useRouter } from "next/navigation";
import { addItems } from "@/lib/storage";
import { computeExpiryDate } from "@/lib/expiry";
import ItemForm from "@/components/ItemForm";

// 영수증 없이 품목을 직접 추가하는 보조 경로. 구매일은 추가한 날로 본다 (PRD 4장 145줄).
export default function AddPage() {
  const router = useRouter();

  function handleSubmit(data) {
    const purchaseDateTime = new Date().toISOString();
    addItems([
      {
        name: data.name,
        quantity: data.quantity,
        storageType: data.storageType,
        purchaseDateTime,
        expiryDate: computeExpiryDate(purchaseDateTime, data.days),
        registeredVia: "직접", // 서버 호출 없음, 영수증 중복 검사 대상에서 제외 (DESIGN.md)
      },
    ]);
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
        직접 추가하기
      </h1>
      <ItemForm submitLabel="추가하기" onSubmit={handleSubmit} />
    </div>
  );
}
