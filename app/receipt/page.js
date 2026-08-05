"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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

function generateKey() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const CORNER_CLASSES = [
  "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
  "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
];

export default function ReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [images, setImages] = useState([]); // 메모리에만 유지, 기기 저장 안 함 (PRD 8장)
  const [step, setStep] = useState("capture"); // capture | uploading | duplicate | confirm
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [purchaseDateTime, setPurchaseDateTime] = useState(null);
  const [reviewItems, setReviewItems] = useState([]);
  const [resolutions, setResolutions] = useState({});

  // 은행 카드 스캔처럼, 뷰파인더 박스에 실제 카메라 화면을 실시간으로 띄운다.
  useEffect(() => {
    if (step !== "capture") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraReady(false);
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      })
      .catch(() => setCameraReady(false));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraReady(false);
    };
  }, [step]);

  function captureFromCamera() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    setImages((prev) => [...prev, canvas.toDataURL("image/jpeg", 0.9)]);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function handleShutter() {
    if (cameraReady) {
      captureFromCamera();
    } else {
      openFilePicker();
    }
  }

  async function handleFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const dataUrls = await Promise.all(files.map(fileToDataUrl));
    setImages((prev) => [...prev, ...dataUrls]);
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

      // 자동 매칭 여부와 관계없이 스캔된 품목 전부를 확인 화면에 띄운다 — 아무것도 몰래 저장하지 않는다.
      const matchedReview = autoItems.map((item) => ({
        key: generateKey(),
        headerText: item.name,
        initialName: item.name,
        initialStorage: item.storageType,
        quantity: item.quantity,
        expanded: false,
      }));
      const unmatchedReview = needsConfirmation.map((item) => ({
        key: item.key,
        headerText: item.reason === "unreadable" ? "??? (읽지 못한 줄)" : item.rawName,
        initialName: item.reason === "unreadable" ? "" : item.rawName,
        initialStorage: "냉장",
        quantity: item.quantity || 1,
        expanded: true,
      }));

      const combined = [...matchedReview, ...unmatchedReview];
      if (combined.length === 0) {
        router.push("/");
        return;
      }

      setPurchaseDateTime(data.purchaseDateTime);
      setReviewItems(combined);
      setResolutions({});
      setStep("confirm");
    } catch (err) {
      setImages([]);
      setErrorMessage(
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "처리 시간이 너무 오래 걸렸습니다. 다시 시도해주세요."
          : "네트워크 오류로 영수증을 인식하지 못했습니다."
      );
      setStep("capture");
    }
  }

  function handleCardChange(key, data) {
    setResolutions((prev) => ({ ...prev, [key]: data }));
  }

  function handleRemove(key) {
    setReviewItems((prev) => prev.filter((item) => item.key !== key));
    setResolutions((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleConfirmCheckin() {
    const records = reviewItems
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

  const allReady = reviewItems.length > 0 && reviewItems.every((item) => resolutions[item.key] != null);

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
          <canvas ref={canvasRef} className="hidden" />

          <div
            className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl"
            style={{ backgroundColor: "var(--color-surface-alt)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
          >
            {cameraReady ? (
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <button
                type="button"
                onClick={openFilePicker}
                className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                카메라를 사용할 수 없어요. 탭해서 사진을 선택해주세요.
              </button>
            )}

            {/* 실제 카메라 화면 위에 얹는 장식 오버레이 (코너 브래킷 + 스캔 라인) */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative h-[85%] w-[75%]">
                {CORNER_CLASSES.map((cls) => (
                  <span key={cls} className={`absolute h-8 w-8 border-white/70 ${cls}`} aria-hidden />
                ))}
                <span
                  className="absolute left-0 right-0 top-1/2 h-[2px]"
                  style={{ backgroundColor: "var(--color-brand-light)" }}
                  aria-hidden
                />
              </div>
            </div>

            {images.length > 0 && (
              <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
                촬영된 사진 {images.length}장
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-center text-sm" style={{ color: "var(--color-red)" }}>
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleShutter}
              className="flex size-20 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--color-surface-muted)" }}
              aria-label="촬영하기"
            >
              <span className="flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-brand)" }}>
                <Image src="/icons/camera-shutter.svg" alt="" width={27} height={24} />
              </span>
            </button>

            <div className="flex w-full gap-2">
              <button
                type="button"
                onClick={handleShutter}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-primary)" }}
              >
                <Image src="/icons/retake.svg" alt="" width={15} height={15} />
                이어서 촬영하기
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={images.length === 0}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: "var(--color-brand)" }}
              >
                체크인 진행하기
                <Image src="/icons/checkin-proceed.svg" alt="" width={13} height={13} />
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
          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
            동일한 영수증을 이미 입력했습니다
          </p>
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
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              체크인 확인하기
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              냉장고에 체크인하기 전, 품목이 맞는지 확인해주세요.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {reviewItems.map((item) => (
              <ReceiptConfirmCard key={item.key} item={item} onChange={handleCardChange} onRemove={handleRemove} />
            ))}
            {reviewItems.length === 0 && (
              <p className="py-6 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
                남은 품목이 없습니다.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmCheckin}
            disabled={!allReady}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: "var(--color-brand-light)", color: "var(--color-brand-selected-text)" }}
          >
            <Image src="/icons/checkin-confirm.svg" alt="" width={20} height={20} />
            체크인 확정
          </button>
        </div>
      )}
    </>
  );
}
