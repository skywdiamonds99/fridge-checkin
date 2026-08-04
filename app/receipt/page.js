"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { addItems, hasDuplicateReceipt } from "@/lib/storage";
import { computeExpiryDate } from "@/lib/expiry";
import { classifyReceiptItems } from "@/lib/classifyReceiptItems";
import ReceiptConfirmCard from "@/components/ReceiptConfirmCard";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [images, setImages] = useState([]); // 메모리에만 유지, 기기 저장 안 함 (PRD 8장)
  const [step, setStep] = useState("capture"); // capture | uploading | duplicate | confirm
  const [errorMessage, setErrorMessage] = useState("");
  const [purchaseDateTime, setPurchaseDateTime] = useState(null);
  const [pendingConfirm, setPendingConfirm] = useState([]);
  const [resolutions, setResolutions] = useState({});

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    setImages((prev) => [...prev, ...dataUrls]);
  }

  function openCamera() {
    fileInputRef.current?.click();
  }

  function saveAndGoHome(records) {
    if (records.length > 0) addItems(records);
    router.push("/");
  }

  async function handleComplete() {
    if (images.length === 0) return;
    setStep("uploading");
    setErrorMessage("");

    try {
      // 영수증 1장당 10초를 넘지 않는다 (PRD 4장 80줄) — 이어서 찍은 장수만큼 예산을 늘려준다
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
        signal: AbortSignal.timeout(images.length * 10000),
      });
      const data = await res.json();
      setImages([]); // 응답을 받는 즉시 촬영분은 폐기

      if (!res.ok) {
        setErrorMessage(data.error || "영수증을 인식하지 못했습니다. 다시 시도해주세요.");
        setStep("capture");
        return;
      }

      // 등록 경로가 '영수증'인 기존 항목만 대상으로, 완료 시점에 등록 단위로 1회 검사 (PRD 4장 78줄)
      if (hasDuplicateReceipt(data.purchaseDateTime)) {
        setStep("duplicate");
        return;
      }

      const { autoItems, needsConfirmation } = classifyReceiptItems(data.items);

      // 기준표에 자동 매칭된 품목은 사람 개입 없이 곧바로 저장한다
      const autoRecords = autoItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        storageType: item.storageType,
        purchaseDateTime: data.purchaseDateTime,
        expiryDate: computeExpiryDate(data.purchaseDateTime, item.days),
        registeredVia: "영수증",
      }));
      if (autoRecords.length > 0) addItems(autoRecords);

      if (needsConfirmation.length === 0) {
        router.push("/");
        return;
      }

      setPurchaseDateTime(data.purchaseDateTime);
      setPendingConfirm(needsConfirmation);
      setResolutions({});
      setStep("confirm");
    } catch (err) {
      setImages([]);
      setErrorMessage(
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "처리 시간이 너무 오래 걸려 중단했습니다. 다시 시도해주세요."
          : "네트워크 오류로 영수증을 인식하지 못했습니다."
      );
      setStep("capture");
    }
  }

  function handleCardChange(key, data) {
    setResolutions((prev) => ({ ...prev, [key]: data }));
  }

  function handleDiscard(key) {
    setPendingConfirm((prev) => prev.filter((item) => item.key !== key));
    setResolutions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleFinishConfirm() {
    const records = pendingConfirm
      .map((item) => resolutions[item.key])
      .filter(Boolean)
      .map((data) => ({
        name: data.name,
        quantity: data.quantity,
        storageType: data.storageType,
        purchaseDateTime,
        expiryDate: computeExpiryDate(purchaseDateTime, data.days),
        registeredVia: "영수증",
      }));
    saveAndGoHome(records);
  }

  const allReady = pendingConfirm.every((item) => resolutions[item.key] != null);

  return (
    <>
      {step === "capture" && (
        <div className="flex flex-col gap-6 px-4 pb-6 pt-8">
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-4xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              냉장고 체크인
            </h1>
            <p className="max-w-[280px] text-base" style={{ color: "var(--color-text-secondary)" }}>
              영수증을 찍어주세요
              <br />
              자동으로 냉장고에 체크인 시켜드립니다
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          <button
            type="button"
            onClick={openCamera}
            className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-3xl"
            style={{ backgroundColor: "var(--color-surface-alt)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
          >
            <div className="relative h-[85%] w-[75%]">
              {["top-0 left-0 border-t-4 border-l-4 rounded-tl-xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl"].map(
                (cls) => (
                  <span key={cls} className={`absolute h-8 w-8 border-white/70 ${cls}`} aria-hidden />
                )
              )}
              <span className="absolute left-0 right-0 top-1/2 h-[2px]" style={{ backgroundColor: "var(--color-brand-light)" }} aria-hidden />
            </div>
            <p className="absolute bottom-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {images.length > 0 ? `촬영된 사진 ${images.length}장` : "탭해서 촬영 / 사진 선택"}
            </p>
          </button>

          {errorMessage && <p className="text-center text-sm" style={{ color: "var(--color-red)" }}>{errorMessage}</p>}

          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={openCamera}
              className="flex size-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-surface-muted)" }}
              aria-label="촬영하기"
            >
              <span className="flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-brand)" }}>
                <svg width="26" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M4 4h4l2-2h4l2 2h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </span>
            </button>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={openCamera}
                className="min-h-[52px] flex-1 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
              >
                이어서 촬영하기
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={images.length === 0}
                className="min-h-[52px] flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                체크인 진행하기 →
              </button>
            </div>
          </div>

          <p className="text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>
            📎 사진이 외부로 전송되어 인식에 사용됩니다
          </p>
        </div>
      )}

      {step === "uploading" && (
        <p className="p-8 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          영수증을 읽는 중입니다… (최대 10초)
        </p>
      )}

      {step === "duplicate" && (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>동일한 영수증을 이미 입력했습니다</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="min-h-[44px] rounded-lg px-6 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            홈으로
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="flex flex-col gap-4 px-4 pb-6 pt-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              체크인 내용물 확인하기
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              기준표에서 바로 찾지 못한 {pendingConfirm.length}개를 확인해주세요. 이름을 고치거나, 보관 구분과 일수를
              직접 정할 수 있어요.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {pendingConfirm.map((item) => (
              <ReceiptConfirmCard key={item.key} item={item} onChange={handleCardChange} onDiscard={handleDiscard} />
            ))}
            {pendingConfirm.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                남은 확인 품목이 없습니다.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleFinishConfirm}
            disabled={!allReady}
            className="min-h-[52px] rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--color-brand-light)", color: "var(--color-brand-selected-text)" }}
          >
            확인하고 추가하기
          </button>
        </div>
      )}
    </>
  );
}
