// 품목 데이터를 기기 로컬(localStorage)에 저장하고 읽어온다. 서버 DB는 쓰지 않는다 (PRD 8장).
const STORAGE_KEY = "fridge-items";

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadItems() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// 이름이 같아도 합치지 않는다. 구매일시가 다르면 소비기한도 다르기 때문이다 (PRD 4장 73줄).
// newItemsInput: [{ name, quantity, storageType, purchaseDateTime, expiryDate, registeredVia }]
export function addItems(newItemsInput) {
  const items = loadItems();
  const withIds = newItemsInput.map((item) => ({ id: generateId(), ...item }));
  const next = [...items, ...withIds];
  saveItems(next);
  return next;
}

export function decreaseQuantity(id) {
  const items = loadItems();
  const next = items
    .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
  saveItems(next);
  return next;
}

export function deleteItem(id) {
  const items = loadItems();
  const next = items.filter((item) => item.id !== id);
  saveItems(next);
  return next;
}

// 등록 경로가 '영수증'인 항목만 중복 검사 대상으로 삼는다 (DESIGN.md 데이터 모델).
export function hasDuplicateReceipt(purchaseDateTime) {
  const items = loadItems();
  return items.some(
    (item) => item.registeredVia === "영수증" && item.purchaseDateTime === purchaseDateTime
  );
}
